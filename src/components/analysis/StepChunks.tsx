import { Button } from "@/src/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import type { AnalysisResult } from "@/src/types/index";

interface StepChunksProps {
  chunks: AnalysisResult["chunks"];
  review_summary: AnalysisResult["review_summary"];
  savedChunks: Set<number>;
  onSaveChunk: (chunk: AnalysisResult["chunks"][number], index: number) => void;
}

export function StepChunks({
  chunks,
  review_summary,
  savedChunks,
  onSaveChunk,
}: StepChunksProps) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-2 text-indigo-600 font-semibold uppercase tracking-wider text-sm mt-12">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100">
          5
        </span>
        Chunks & Review
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-zinc-900">Reusable Chunks</h3>
        <div className="grid gap-4 md:grid-cols-2">
          {chunks.map((chunk, i) => (
            <Card key={i} className="border-zinc-200">
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-bold text-lg text-indigo-600">
                      {chunk.expression}
                    </h4>
                    <p className="text-zinc-600">{chunk.meaning}</p>
                  </div>
                  <Button
                    size="sm"
                    variant={savedChunks.has(i) ? "secondary" : "outline"}
                    onClick={() => onSaveChunk(chunk, i)}
                    disabled={savedChunks.has(i)}
                  >
                    {savedChunks.has(i) ? "Saved" : "Save"}
                  </Button>
                </div>
                <div className="space-y-2 mt-4 pt-4 border-t border-zinc-100">
                  <p className="text-xs font-semibold text-zinc-400 uppercase">
                    Examples
                  </p>
                  <ul className="space-y-1 text-sm text-zinc-700">
                    {chunk.examples.map((ex, j) => (
                      <li key={j} className="italic">
                        &ldquo;{ex}&rdquo;
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Card className="bg-emerald-50/50 border-emerald-200 mt-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-emerald-700 uppercase tracking-wider">
            Review Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <p className="text-xs font-semibold text-emerald-600/70 uppercase mb-1">
                Look First
              </p>
              <p className="text-emerald-900 font-medium">
                {review_summary.look_first}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-emerald-600/70 uppercase mb-1">
                Easy to Misread
              </p>
              <p className="text-emerald-900 font-medium">
                {review_summary.easy_to_misread}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-emerald-600/70 uppercase mb-1">
                Next Time
              </p>
              <p className="text-emerald-900 font-medium">
                {review_summary.how_to_parse_next_time}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
