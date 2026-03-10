import { Card, CardContent } from "@/src/components/ui/card";
import { ChevronDown } from "lucide-react";
import { cn } from "@/src/lib/utils";
import type { AnalysisResult } from "@/src/types/index";

interface StepTreeProps {
  structure_tree: AnalysisResult["structure_tree"];
}

function Tree({
  nodes,
  level = 0,
}: {
  nodes: AnalysisResult["structure_tree"];
  level?: number;
}) {
  return (
    <ul
      className={cn(
        "space-y-2",
        level > 0 && "ml-6 border-l border-zinc-300 pl-4 mt-2",
      )}
    >
      {nodes.map((node, i) => (
        <li key={i} className="text-zinc-800">
          <div className="flex items-center gap-2">
            {node.children && node.children.length > 0 ? (
              <ChevronDown className="w-4 h-4 text-zinc-400" />
            ) : (
              <span className="w-4 inline-block" />
            )}
            <span
              className={cn(
                "px-2 py-1 rounded-md",
                level === 0
                  ? "bg-indigo-100 text-indigo-900 font-semibold"
                  : "bg-white border border-zinc-200",
              )}
            >
              {node.label}
            </span>
          </div>
          {node.children && node.children.length > 0 && (
            <Tree nodes={node.children} level={level + 1} />
          )}
        </li>
      ))}
    </ul>
  );
}

export function StepTree({ structure_tree }: StepTreeProps) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-2 text-indigo-600 font-semibold uppercase tracking-wider text-sm mt-12">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100">
          3
        </span>
        Structure Tree
      </div>

      <Card className="bg-zinc-50 border-zinc-200">
        <CardContent className="p-6 font-mono text-sm">
          <Tree nodes={structure_tree} />
        </CardContent>
      </Card>
    </div>
  );
}
