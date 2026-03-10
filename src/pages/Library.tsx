import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import { BookOpen, Bookmark, History } from "lucide-react";

export default function Library() {
  const [activeTab, setActiveTab] = useState<"history" | "saved" | "chunks">(
    "history",
  );
  const [history, setHistory] = useState<any[]>([]);
  const [savedSentences, setSavedSentences] = useState<any[]>([]);
  const [chunks, setChunks] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/history")
      .then((res) => res.json())
      .then((data) => setHistory(data))
      .catch(console.error);

    fetch("/api/saved")
      .then((res) => res.json())
      .then((data) => setSavedSentences(data))
      .catch(console.error);

    fetch("/api/chunks")
      .then((res) => res.json())
      .then((data) => setChunks(data))
      .catch(console.error);
  }, []);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
          Library
        </h1>
      </div>

      <div className="flex gap-4 border-b border-zinc-200 pb-px">
        <button
          onClick={() => setActiveTab("history")}
          className={`pb-4 text-sm font-medium transition-colors border-b-2 ${
            activeTab === "history"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-zinc-500 hover:text-zinc-900 hover:border-zinc-300"
          }`}
        >
          <div className="flex items-center gap-2">
            <History className="w-4 h-4" /> Recent History
          </div>
        </button>
        <button
          onClick={() => setActiveTab("saved")}
          className={`pb-4 text-sm font-medium transition-colors border-b-2 ${
            activeTab === "saved"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-zinc-500 hover:text-zinc-900 hover:border-zinc-300"
          }`}
        >
          <div className="flex items-center gap-2">
            <Bookmark className="w-4 h-4" /> Saved Sentences
          </div>
        </button>
        <button
          onClick={() => setActiveTab("chunks")}
          className={`pb-4 text-sm font-medium transition-colors border-b-2 ${
            activeTab === "chunks"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-zinc-500 hover:text-zinc-900 hover:border-zinc-300"
          }`}
        >
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" /> Expression Chunks
          </div>
        </button>
      </div>

      <div className="mt-8">
        {activeTab === "history" && (
          <div className="grid gap-4">
            {history.length === 0 ? (
              <p className="text-zinc-500 text-center py-12">
                No history yet. Start analyzing sentences!
              </p>
            ) : (
              history.map((item) => (
                <Card
                  key={item.id}
                  className="hover:border-indigo-300 transition-colors cursor-pointer"
                >
                  <CardContent className="p-6">
                    <p className="text-lg font-serif text-zinc-900">
                      {item.text}
                    </p>
                    <p className="text-xs text-zinc-400 mt-4">
                      {new Date(item.created_at).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {activeTab === "saved" && (
          <div className="grid gap-4">
            {savedSentences.length === 0 ? (
              <div className="text-center py-20 border-2 border-dashed border-zinc-200 rounded-xl">
                <Bookmark className="w-8 h-8 text-zinc-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-zinc-900">
                  No saved sentences
                </h3>
                <p className="text-zinc-500 mt-2">
                  Sentences you save will appear here.
                </p>
              </div>
            ) : (
              savedSentences.map((item) => {
                const analysis = JSON.parse(item.analysis_json);
                return (
                  <Card
                    key={item.id}
                    className="hover:border-indigo-300 transition-colors"
                  >
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <p className="text-lg font-serif text-zinc-900">
                          {item.text}
                        </p>
                        <Badge variant="secondary">
                          {analysis.sentence_type.category}
                        </Badge>
                      </div>
                      <div className="bg-zinc-50 p-3 rounded-md mb-4">
                        <p className="text-sm font-mono text-zinc-700">
                          {analysis.core_skeleton}
                        </p>
                      </div>
                      <p className="text-sm text-zinc-600">
                        {analysis.meaning.natural_cn}
                      </p>
                      <p className="text-xs text-zinc-400 mt-4">
                        Saved on{" "}
                        {new Date(item.created_at).toLocaleDateString()}
                      </p>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        )}

        {activeTab === "chunks" && (
          <div className="grid gap-4 md:grid-cols-2">
            {chunks.length === 0 ? (
              <div className="col-span-full text-center py-20 border-2 border-dashed border-zinc-200 rounded-xl">
                <BookOpen className="w-8 h-8 text-zinc-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-zinc-900">
                  No expression chunks
                </h3>
                <p className="text-zinc-500 mt-2">
                  Chunks you save from analysis will appear here.
                </p>
              </div>
            ) : (
              chunks.map((chunk) => {
                const examples = JSON.parse(chunk.examples || "[]");
                return (
                  <Card key={chunk.id} className="border-zinc-200">
                    <CardContent className="p-5">
                      <div className="mb-4">
                        <h4 className="font-bold text-lg text-indigo-600">
                          {chunk.expression}
                        </h4>
                        <p className="text-zinc-600">{chunk.meaning}</p>
                      </div>
                      {examples.length > 0 && (
                        <div className="space-y-2 mt-4 pt-4 border-t border-zinc-100">
                          <p className="text-xs font-semibold text-zinc-400 uppercase">
                            Examples
                          </p>
                          <ul className="space-y-1 text-sm text-zinc-700">
                            {examples.map((ex: string, j: number) => (
                              <li key={j} className="italic">
                                &ldquo;{ex}&rdquo;
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
