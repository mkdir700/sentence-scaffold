import { Badge } from "@/src/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import type { AnalysisResult } from "@/src/types/index";

interface StepSkeletonProps {
  sentence_type: AnalysisResult["sentence_type"];
  main_clause: AnalysisResult["main_clause"];
  core_skeleton: AnalysisResult["core_skeleton"];
}

export function StepSkeleton({
  sentence_type,
  main_clause,
  core_skeleton,
}: StepSkeletonProps) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-2 text-indigo-600 font-semibold uppercase tracking-wider text-sm">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100">
          1
        </span>
        Core Skeleton
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="bg-indigo-50/50 border-indigo-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-indigo-600 uppercase tracking-wider">
              Sentence Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 mb-2">
              <Badge variant="default" className="bg-indigo-600">
                {sentence_type.category}
              </Badge>
            </div>
            <p className="text-zinc-700">{sentence_type.summary}</p>
          </CardContent>
        </Card>

        <Card className="border-zinc-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-zinc-500 uppercase tracking-wider">
              Main Clause
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex gap-4">
                <span className="w-20 text-sm font-medium text-zinc-400">
                  Subject
                </span>
                <span className="font-medium text-zinc-900">
                  {main_clause.subject}
                </span>
              </div>
              <div className="flex gap-4">
                <span className="w-20 text-sm font-medium text-zinc-400">
                  Verb
                </span>
                <span className="font-medium text-zinc-900">
                  {main_clause.verb}
                </span>
              </div>
              {main_clause.complement && (
                <div className="flex gap-4">
                  <span className="w-20 text-sm font-medium text-zinc-400">
                    Complement
                  </span>
                  <span className="font-medium text-zinc-900">
                    {main_clause.complement}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-zinc-900 text-zinc-50 border-zinc-800">
        <CardContent className="p-6 text-center">
          <p className="text-sm text-zinc-400 uppercase tracking-wider mb-2">
            Minimal Skeleton
          </p>
          <p className="text-xl font-mono text-emerald-400">{core_skeleton}</p>
        </CardContent>
      </Card>
    </div>
  );
}
