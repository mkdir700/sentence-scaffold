import { Badge } from "@/src/components/ui/badge";
import { Card, CardContent } from "@/src/components/ui/card";
import type { AnalysisResult } from "@/src/types/index";

interface StepModifiersProps {
  components: AnalysisResult["components"];
}

export function StepModifiers({ components }: StepModifiersProps) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-2 text-indigo-600 font-semibold uppercase tracking-wider text-sm mt-12">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100">
          2
        </span>
        Modifiers & Components
      </div>

      <div className="grid gap-4">
        {components.map((comp, i) => (
          <Card
            key={i}
            className="border-zinc-200 hover:border-indigo-300 transition-colors"
          >
            <CardContent className="p-4 flex flex-col md:flex-row md:items-center gap-4">
              <div className="md:w-1/3">
                <Badge variant="secondary" className="mb-2">
                  {comp.role}
                </Badge>
                <p className="font-medium text-lg text-zinc-900">{comp.text}</p>
              </div>
              <div className="md:w-2/3 space-y-2 border-l-2 border-zinc-100 pl-4">
                {comp.modifies && (
                  <p className="text-zinc-600">
                    <span className="text-sm font-medium text-zinc-400 mr-2">
                      Modifies:
                    </span>
                    <span className="font-medium text-indigo-600">
                      {comp.modifies}
                    </span>
                  </p>
                )}
                {comp.explains && (
                  <p className="text-zinc-600">
                    <span className="text-sm font-medium text-zinc-400 mr-2">
                      Explains:
                    </span>
                    {comp.explains}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
