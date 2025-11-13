import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Code2, ArrowRight, Copy, Loader2 } from "lucide-react";

const LANGUAGES = [
  "Natural Language", "Pseudocode",
  "JavaScript", "TypeScript", "Python", "Java", "C", "C++", "C#", "Ruby", "Go",
  "Rust", "Swift", "Kotlin", "PHP", "Pascal", "SQL", "HTML", "CSS", "Lua"
].sort();

const Index = () => {
  const [sourceCode, setSourceCode] = useState("");
  const [targetCode, setTargetCode] = useState("");
  const [sourceLanguage, setSourceLanguage] = useState("JavaScript");
  const [targetLanguage, setTargetLanguage] = useState("Pascal");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleTranslate = async () => {
    if (!sourceCode.trim()) {
      toast({
        title: "No code provided",
        description: "Please enter some code to translate.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setTargetCode("");

    try {
      const { data, error } = await supabase.functions.invoke("translate-code", {
        body: {
          sourceCode,
          sourceLanguage,
          targetLanguage,
        },
      });

      if (error) throw error;

      if (data?.translatedCode) {
        setTargetCode(data.translatedCode);
        toast({
          title: "Translation complete!",
          description: `Successfully translated from ${sourceLanguage} to ${targetLanguage}`,
        });
      }
    } catch (error: any) {
      console.error("Translation error:", error);
      toast({
        title: "Translation failed",
        description: error.message || "Failed to translate code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: "Code copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Could not copy to clipboard",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-primary">
              <Code2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">CodeTranslate</h1>
              <p className="text-sm text-muted-foreground">AI-powered code language converter</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Language Selectors */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Source Language</label>
              <Select value={sourceLanguage} onValueChange={setSourceLanguage}>
                <SelectTrigger className="bg-card border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((lang) => (
                    <SelectItem key={lang} value={lang}>
                      {lang}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="pt-6">
              <ArrowRight className="h-6 w-6 text-primary" />
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Target Language</label>
              <Select value={targetLanguage} onValueChange={setTargetLanguage}>
                <SelectTrigger className="bg-card border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((lang) => (
                    <SelectItem key={lang} value={lang}>
                      {lang}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Code Editors */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Source Code */}
            <Card className="p-6 bg-card border-border shadow-card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Source Code</h2>
                {sourceCode && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(sourceCode)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <Textarea
                value={sourceCode}
                onChange={(e) => setSourceCode(e.target.value)}
                placeholder={`Enter your ${sourceLanguage} code here...`}
                className="min-h-[400px] font-mono text-sm bg-background border-border resize-none"
              />
            </Card>

            {/* Target Code */}
            <Card className="p-6 bg-card border-border shadow-card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Translated Code</h2>
                {targetCode && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(targetCode)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <Textarea
                value={targetCode}
                readOnly
                placeholder={isLoading ? "Translating..." : `${targetLanguage} code will appear here...`}
                className="min-h-[400px] font-mono text-sm bg-background border-border resize-none"
              />
            </Card>
          </div>

          {/* Translate Button */}
          <div className="flex justify-center">
            <Button
              onClick={handleTranslate}
              disabled={isLoading || !sourceCode.trim()}
              size="lg"
              className="bg-gradient-primary text-white shadow-glow hover:opacity-90 transition-opacity px-8"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Translating...
                </>
              ) : (
                <>
                  <Code2 className="mr-2 h-5 w-5" />
                  Translate Code
                </>
              )}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
