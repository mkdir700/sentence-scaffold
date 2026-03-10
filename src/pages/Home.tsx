import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Button } from "@/src/components/ui/button";
import {
  Card,
  CardContent,
} from "@/src/components/ui/card";
import { ArrowRight, Loader2, Sparkles } from "lucide-react";
import { analyzeSentence } from "@/src/services/ai";

export default function Home() {
  const [sentence, setSentence] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("/api/history")
      .then((res) => res.json())
      .then((data) => setHistory(data))
      .catch(console.error);
  }, []);

  const handleAnalyze = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!sentence.trim()) return;

    setIsLoading(true);
    try {
      // Check if already analyzed
      const checkRes = await fetch("/api/check-sentence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sentence }),
      });

      let data;
      if (checkRes.ok) {
        data = await checkRes.json();
      } else {
        // Analyze with AI
        data = await analyzeSentence(sentence);

        // Save to DB
        await fetch("/api/save-sentence", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sentence, analysis: data }),
        });
      }

      navigate("/analysis", { state: { analysis: data } });
    } catch (error) {
      console.error(error);
      alert("Failed to analyze sentence. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const exampleSentences = [
    "This is what a room full of computers looked like in old times.",
    "The component that is responsible for rendering the UI is called React.",
    "Having finished his homework, the boy went out to play with his friends.",
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-12 py-12">
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-bold tracking-tight text-zinc-900">
          Sentence Scaffold
        </h1>
        <p className="text-xl text-zinc-500">
          Learn English by seeing the structure first.
        </p>
      </div>

      <Card className="border-2 border-indigo-100 shadow-lg shadow-indigo-100/50">
        <CardContent className="p-8">
          <form onSubmit={handleAnalyze} className="space-y-6">
            <div className="space-y-2">
              <label
                htmlFor="sentence"
                className="text-sm font-medium text-zinc-700"
              >
                Enter an English sentence
              </label>
              <textarea
                id="sentence"
                value={sentence}
                onChange={(e) => setSentence(e.target.value)}
                placeholder="Paste a long or difficult sentence here..."
                className="w-full min-h-[120px] p-4 rounded-xl border border-zinc-200 bg-zinc-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none text-lg"
              />
            </div>
            <div className="flex justify-end">
              <Button
                type="submit"
                size="lg"
                disabled={!sentence.trim() || isLoading}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-8"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5" />
                    Analyze Structure
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider">
          Try an example
        </h3>
        <div className="grid gap-3">
          {exampleSentences.map((ex, i) => (
            <button
              key={i}
              onClick={() => {
                setSentence(ex);
              }}
              className="text-left p-4 rounded-xl border border-zinc-200 bg-white hover:border-indigo-300 hover:shadow-sm transition-all text-zinc-700"
            >
              {ex}
            </button>
          ))}
        </div>
      </div>

      {history.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider">
            Recent History
          </h3>
          <div className="space-y-2">
            {history.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 rounded-xl bg-white border border-zinc-100"
              >
                <p className="truncate pr-4 text-zinc-600">{item.text}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSentence(item.text);
                    handleAnalyze();
                  }}
                >
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
