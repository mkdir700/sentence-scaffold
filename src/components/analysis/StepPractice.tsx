import { useState } from "react";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent } from "@/src/components/ui/card";
import { useFeedback } from "@/src/hooks/mutations";
import type { AnalysisResult } from "@/src/types/index";

interface StepPracticeProps {
  practice: AnalysisResult["practice"];
}

interface PracticeCardProps {
  task: { cn: string; hint: string; reference: string };
  index: number;
  total: number;
}

function PracticeCard({ task, index, total }: PracticeCardProps) {
  const [answer, setAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [commentary, setCommentary] = useState<string | null>(null);

  const feedback = useFeedback();

  const handleSubmit = () => {
    feedback.mutate(
      {
        userTranslation: answer,
        reference: task.reference,
        hint: task.hint,
        cn: task.cn,
      },
      {
        onSuccess: (data) => {
          setSubmitted(true);
          setCommentary(data.commentary);
        },
      }
    );
  };

  return (
    <Card className="border-zinc-200">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Task {index + 1} / {total}
          </span>
          <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
            {task.hint}
          </span>
        </div>

        <p className="font-medium text-lg text-zinc-900">{task.cn}</p>

        {!submitted ? (
          <div className="space-y-4">
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Type your English translation here..."
              className="w-full min-h-[80px] p-3 rounded-lg border border-zinc-200 bg-zinc-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none text-sm"
              disabled={feedback.isPending}
            />
            {feedback.isError && (
              <p className="text-sm text-red-600">
                {feedback.error instanceof Error
                  ? feedback.error.message
                  : "Failed to get feedback. Please try again."}
              </p>
            )}
            <Button
              onClick={handleSubmit}
              disabled={feedback.isPending || submitted || !answer.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {feedback.isPending ? "Getting feedback..." : "Submit"}
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
              <p className="text-indigo-900 font-medium">{task.reference}</p>
            </div>
            {commentary && (
              <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-100">
                <p className="text-xs font-semibold text-emerald-600 uppercase mb-1">
                  Feedback
                </p>
                <p className="text-emerald-900">{commentary}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function StepPractice({ practice }: StepPracticeProps) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-2 text-indigo-600 font-semibold uppercase tracking-wider text-sm mt-12">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100">
          6
        </span>
        Output Practice
      </div>

      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="p-6">
          <p className="text-sm font-semibold text-amber-700 uppercase tracking-wider mb-2">
            Scenario
          </p>
          <p className="text-zinc-800">{practice.scenario}</p>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {practice.tasks.map((task, i) => (
          <PracticeCard
            key={i}
            task={task}
            index={i}
            total={practice.tasks.length}
          />
        ))}
      </div>
    </div>
  );
}
