import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sourceCode, sourceLanguage, targetLanguage } = await req.json();

    if (!sourceCode || !sourceLanguage || !targetLanguage) {
      throw new Error("Missing required parameters");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    console.log(`Translating from ${sourceLanguage} to ${targetLanguage}`);

    const isNaturalLanguageSource = sourceLanguage === "Natural Language" || sourceLanguage === "Pseudocode";
    
    const systemPrompt = isNaturalLanguageSource
      ? `You are an expert programmer. Your task is to convert natural language descriptions or pseudocode into working ${targetLanguage} code while:
1. Understanding the intent and logic from the description
2. Following ${targetLanguage}'s best practices and idioms
3. Writing clean, well-structured code with proper indentation
4. Adding brief comments only when necessary to explain complex logic
5. Ensuring the code is syntactically correct and functional
6. Using consistent formatting with proper spacing and line breaks
7. Making reasonable assumptions for unspecified details

Only return the working code without any explanations or markdown formatting. The code must be properly indented and well-structured.`
      : `You are an expert code translator. Your task is to accurately translate code from one programming language to another while:
1. Preserving the logic and functionality
2. Following the target language's best practices and idioms
3. Maintaining proper code structure with correct indentation
4. Adding brief comments only when necessary to explain language-specific differences
5. Ensuring the translated code is syntactically correct and functional
6. Using consistent formatting with proper spacing and line breaks
7. Organizing code in a clean, readable structure

Only return the translated code without any explanations or markdown formatting. The code must be properly indented and well-structured.`;

    const userPrompt = isNaturalLanguageSource
      ? `Convert the following ${sourceLanguage} into ${targetLanguage} code:\n\n${sourceCode}`
      : `Translate the following ${sourceLanguage} code to ${targetLanguage}:\n\n${sourceCode}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: userPrompt
          }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        throw new Error("Rate limit exceeded. Please try again in a moment.");
      }
      if (response.status === 402) {
        throw new Error("AI credits exhausted. Please add credits to continue.");
      }
      throw new Error("Failed to translate code");
    }

    const data = await response.json();
    const translatedCode = data.choices?.[0]?.message?.content;

    if (!translatedCode) {
      throw new Error("No translation received");
    }

    console.log("Translation successful");

    return new Response(
      JSON.stringify({ translatedCode }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Translation error:", error);
    const errorMessage = error instanceof Error ? error.message : "Translation failed";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
