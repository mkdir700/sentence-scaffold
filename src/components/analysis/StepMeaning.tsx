import { CheckCircle2, Lightbulb } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import type { AnalysisResult } from "@/src/types/index";

interface StepMeaningProps {
  meaning: AnalysisResult["meaning"];
  key_points: AnalysisResult["key_points"];
}

export function StepMeaning({ meaning, key_points }: StepMeaningProps) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-2 text-indigo-600 font-semibold uppercase tracking-wider text-sm mt-12">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100">
          4
        </span>
        Meaning & Key Points
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-zinc-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-zinc-500 uppercase tracking-wider">
              Meaning
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase mb-1">
                Literal Translation
              </p>
              <p className="text-zinc-700">{meaning.literal_cn}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase mb-1">
                Natural Translation
              </p>
              <p className="text-zinc-900 font-medium">{meaning.natural_cn}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-amber-50/50 border-amber-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-amber-600 uppercase tracking-wider flex items-center gap-2">
              <Lightbulb className="w-4 h-4" /> Key Points
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {key_points.map((kp, i) => (
                <li key={i} className="flex items-start gap-2 text-zinc-800">
                  <CheckCircle2 className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <span>{kp.point}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
