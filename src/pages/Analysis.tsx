import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent } from "@/src/components/ui/card";
import { ArrowLeft, ArrowRight, Loader2, Save } from "lucide-react";
import { analysisQueryOptions } from "@/src/hooks/queries";
import {
  useSaveSentenceToLibrary,
  useSaveChunk,
} from "@/src/hooks/mutations";
import { StepSkeleton } from "@/src/components/analysis/StepSkeleton";
import { StepModifiers } from "@/src/components/analysis/StepModifiers";
import { StepTree } from "@/src/components/analysis/StepTree";
import { StepMeaning } from "@/src/components/analysis/StepMeaning";
import { StepChunks } from "@/src/components/analysis/StepChunks";
import { StepQuiz } from "@/src/components/analysis/StepQuiz";
import type { AnalysisResult } from "@/src/types/index";

export default function Analysis() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const analysisId = Number(id);

  const [step, setStep] = useState(1);
  const [showAll, setShowAll] = useState(false);
  const [savedChunks, setSavedChunks] = useState<Set<number>>(new Set());

  const saveMutation = useSaveSentenceToLibrary();
  const chunkMutation = useSaveChunk();

  const { data, isPending, isFetching, isError, error } = useQuery({
    ...analysisQueryOptions(isNaN(analysisId) ? 0 : analysisId),
    enabled: !isNaN(analysisId),
  });

  if (isNaN(analysisId)) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-zinc-900 mb-4">
          Invalid analysis ID
        </h2>
        <Button onClick={() => void navigate("/")}>Go back home</Button>
      </div>
    );
  }

  if (isPending && isFetching) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
        <p className="text-lg text-zinc-600">Generating analysis...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-zinc-900 mb-4">
          Failed to load analysis
        </h2>
        <p className="text-zinc-600 mb-6">
          {error instanceof Error ? error.message : "An error occurred"}
        </p>
        <Button onClick={() => void navigate("/")}>Go back home</Button>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const handleNextStep = () => {
    if (step < 6) setStep(step + 1);
  };

  const isVisible = (targetStep: number) => showAll || step >= targetStep;

  const handleSaveChunk = (
    chunk: AnalysisResult["chunks"][number],
    index: number,
  ) => {
    chunkMutation.mutate(
      {
        expression: chunk.expression,
        meaning: chunk.meaning,
        examples: chunk.examples,
      },
      {
        onSuccess: () => {
          setSavedChunks((prev) => new Set([...prev, index]));
        },
      },
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => void navigate("/")}
          className="-ml-4 text-zinc-500"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <div className="space-x-4">
          <Button variant="outline" onClick={() => setShowAll(!showAll)}>
            {showAll ? "Step-by-step Mode" : "Show All"}
          </Button>
          <Button
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
            onClick={() => saveMutation.mutate(data.sentence)}
            disabled={saveMutation.isPending || saveMutation.isSuccess}
          >
            <Save className="mr-2 h-4 w-4" />{" "}
            {saveMutation.isPending
              ? "Saving..."
              : saveMutation.isSuccess
                ? "Saved!"
                : "Save Sentence"}
          </Button>
        </div>
      </div>

      {saveMutation.isError && (
        <p className="text-red-600 text-sm">
          {saveMutation.error instanceof Error
            ? saveMutation.error.message
            : "Failed to save sentence"}
        </p>
      )}

      <Card className="border-2 border-zinc-900 shadow-lg">
        <CardContent className="p-8">
          <h2 className="text-2xl font-serif text-zinc-900 leading-relaxed">
            {data.sentence}
          </h2>
        </CardContent>
      </Card>

      {isVisible(1) && (
        <StepSkeleton
          sentence_type={data.sentence_type}
          main_clause={data.main_clause}
          core_skeleton={data.core_skeleton}
        />
      )}

      {isVisible(2) && <StepModifiers components={data.components} />}

      {isVisible(3) && <StepTree structure_tree={data.structure_tree} />}

      {isVisible(4) && (
        <StepMeaning meaning={data.meaning} key_points={data.key_points} />
      )}

      {isVisible(5) && (
        <StepChunks
          chunks={data.chunks}
          review_summary={data.review_summary}
          savedChunks={savedChunks}
          onSaveChunk={handleSaveChunk}
        />
      )}

      {isVisible(6) && <StepQuiz practice={data.practice} />}

      {!showAll && step < 6 && (
        <div className="flex justify-center mt-12">
          <Button
            size="lg"
            onClick={handleNextStep}
            className="bg-zinc-900 text-white hover:bg-zinc-800 rounded-full px-8 shadow-xl shadow-zinc-200"
          >
            Continue to Step {step + 1} <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
