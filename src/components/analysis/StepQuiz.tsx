import { useState } from "react";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent } from "@/src/components/ui/card";
import type { AnalysisResult } from "@/src/types/index";

interface StepQuizProps {
  quiz: AnalysisResult["quiz"];
}

function QuizCard({
  question,
  referenceAnswer,
}: {
  question: string;
  referenceAnswer: string;
}) {
  const [showAnswer, setShowAnswer] = useState(false);
  const [answer, setAnswer] = useState("");

  return (
    <Card className="border-zinc-200">
      <CardContent className="p-6 space-y-4">
        <p className="font-medium text-lg text-zinc-900">{question}</p>

        {!showAnswer ? (
          <div className="space-y-4">
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Type your answer here..."
              className="w-full min-h-[80px] p-3 rounded-lg border border-zinc-200 bg-zinc-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none text-sm"
            />
            <Button
              onClick={() => setShowAnswer(true)}
              disabled={!answer.trim()}
            >
              Check Answer
            </Button>
          </div>
        ) : (
          <div className="space-y-4 animate-in fade-in">
            <div className="p-4 rounded-lg bg-zinc-50 border border-zinc-200">
              <p className="text-xs font-semibold text-zinc-400 uppercase mb-1">
                Your Answer
              </p>
              <p className="text-zinc-700">{answer}</p>
            </div>
            <div className="p-4 rounded-lg bg-indigo-50 border border-indigo-100">
              <p className="text-xs font-semibold text-indigo-400 uppercase mb-1">
                Reference Answer
              </p>
              <p className="text-indigo-900 font-medium">{referenceAnswer}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function StepQuiz({ quiz }: StepQuizProps) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-2 text-indigo-600 font-semibold uppercase tracking-wider text-sm mt-12">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100">
          6
        </span>
        Self Test
      </div>

      <div className="space-y-4">
        {quiz.map((q, i) => (
          <QuizCard
            key={i}
            question={q.question}
            referenceAnswer={q.reference_answer}
          />
        ))}
      </div>
    </div>
  );
}
