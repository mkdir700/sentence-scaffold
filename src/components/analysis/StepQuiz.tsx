import { useState } from "react";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent } from "@/src/components/ui/card";
import type { AnalysisResult } from "@/src/types/index";

interface StepPracticeProps {
  practice: AnalysisResult["practice"];
}

function PracticeCard({
  cn,
  hint,
  reference,
}: {
  cn: string;
  hint: string;
  reference: string;
}) {
  const [showAnswer, setShowAnswer] = useState(false);
  const [answer, setAnswer] = useState("");

  return (
    <Card className="border-zinc-200">
      <CardContent className="p-6 space-y-4">
        <p className="font-medium text-lg text-zinc-900">{cn}</p>
        <p className="text-sm text-indigo-600 font-medium">{hint}</p>

        {!showAnswer ? (
          <div className="space-y-4">
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Type your English translation here..."
              className="w-full min-h-[80px] p-3 rounded-lg border border-zinc-200 bg-zinc-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none text-sm"
            />
            <Button
              onClick={() => setShowAnswer(true)}
              disabled={!answer.trim()}
            >
              Check Reference
            </Button>
          </div>
        ) : (
          <div className="space-y-4 animate-in fade-in">
            <div className="p-4 rounded-lg bg-zinc-50 border border-zinc-200">
              <p className="text-xs font-semibold text-zinc-400 uppercase mb-1">
                Your Translation
              </p>
              <p className="text-zinc-700">{answer}</p>
            </div>
            <div className="p-4 rounded-lg bg-indigo-50 border border-indigo-100">
              <p className="text-xs font-semibold text-indigo-400 uppercase mb-1">
                Reference Translation
              </p>
              <p className="text-indigo-900 font-medium">{reference}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function StepQuiz({ practice }: StepPracticeProps) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-2 text-indigo-600 font-semibold uppercase tracking-wider text-sm mt-12">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100">
          6
        </span>
        Output Practice
      </div>

      <p className="text-zinc-600 text-sm">{practice.scenario}</p>

      <div className="space-y-4">
        {practice.tasks.map((task, i) => (
          <PracticeCard
            key={i}
            cn={task.cn}
            hint={task.hint}
            reference={task.reference}
          />
        ))}
      </div>
    </div>
  );
}
