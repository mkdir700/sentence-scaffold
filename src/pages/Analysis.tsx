import { useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { Button } from "@/src/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Lightbulb,
  Save,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/src/lib/utils";

export default function Analysis() {
  const location = useLocation();
  const navigate = useNavigate();
  const analysis = location.state?.analysis;

  const [step, setStep] = useState(1);
  const [showAll, setShowAll] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedChunks, setSavedChunks] = useState<Set<number>>(new Set());

  const handleSaveSentence = async () => {
    setIsSaving(true);
    try {
      await fetch("/api/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sentence: analysis.sentence }),
      });
      alert("Sentence saved to library!");
    } catch (error) {
      console.error(error);
      alert("Failed to save sentence");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveChunk = async (chunk: any, index: number) => {
    try {
      await fetch("/api/chunks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(chunk),
      });
      setSavedChunks(new Set([...savedChunks, index]));
    } catch (error) {
      console.error(error);
      alert("Failed to save chunk");
    }
  };

  if (!analysis) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-zinc-900 mb-4">
          No analysis found
        </h2>
        <Button onClick={() => navigate("/")}>Go back home</Button>
      </div>
    );
  }

  const {
    sentence,
    sentence_type,
    main_clause,
    core_skeleton,
    components,
    structure_tree,
    meaning,
    key_points,
    chunks,
    review_summary,
    quiz,
  } = analysis;

  const handleNextStep = () => {
    if (step < 6) setStep(step + 1);
  };

  const isVisible = (targetStep: number) => showAll || step >= targetStep;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
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
            onClick={handleSaveSentence}
            disabled={isSaving}
          >
            <Save className="mr-2 h-4 w-4" />{" "}
            {isSaving ? "Saving..." : "Save Sentence"}
          </Button>
        </div>
      </div>

      <Card className="border-2 border-zinc-900 shadow-lg">
        <CardContent className="p-8">
          <h2 className="text-2xl font-serif text-zinc-900 leading-relaxed">
            {sentence}
          </h2>
        </CardContent>
      </Card>

      {/* Step 1: Sentence Type & Main Clause */}
      {isVisible(1) && (
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
              <p className="text-xl font-mono text-emerald-400">
                {core_skeleton}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 2: Modifiers */}
      {isVisible(2) && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center gap-2 text-indigo-600 font-semibold uppercase tracking-wider text-sm mt-12">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100">
              2
            </span>
            Modifiers & Components
          </div>

          <div className="grid gap-4">
            {components.map((comp: any, i: number) => (
              <Card
                key={i}
                className="border-zinc-200 hover:border-indigo-300 transition-colors"
              >
                <CardContent className="p-4 flex flex-col md:flex-row md:items-center gap-4">
                  <div className="md:w-1/3">
                    <Badge variant="secondary" className="mb-2">
                      {comp.role}
                    </Badge>
                    <p className="font-medium text-lg text-zinc-900">
                      {comp.text}
                    </p>
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
      )}

      {/* Step 3: Structure Tree */}
      {isVisible(3) && (
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
      )}

      {/* Step 4: Meaning & Key Points */}
      {isVisible(4) && (
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
                  <p className="text-zinc-900 font-medium">
                    {meaning.natural_cn}
                  </p>
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
                  {key_points.map((kp: any, i: number) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-zinc-800"
                    >
                      <CheckCircle2 className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                      <span>{kp.point}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Step 5: Chunks & Review */}
      {isVisible(5) && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center gap-2 text-indigo-600 font-semibold uppercase tracking-wider text-sm mt-12">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100">
              5
            </span>
            Chunks & Review
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-zinc-900">
              Reusable Chunks
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              {chunks.map((chunk: any, i: number) => (
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
                        onClick={() => handleSaveChunk(chunk, i)}
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
                        {chunk.examples.map((ex: string, j: number) => (
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
      )}

      {/* Step 6: Quiz */}
      {isVisible(6) && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center gap-2 text-indigo-600 font-semibold uppercase tracking-wider text-sm mt-12">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100">
              6
            </span>
            Self Test
          </div>

          <div className="space-y-4">
            {quiz.map((q: any, i: number) => (
              <QuizCard
                key={i}
                question={q.question}
                referenceAnswer={q.reference_answer}
              />
            ))}
          </div>
        </div>
      )}

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

function Tree({ nodes, level = 0 }: { nodes: any[]; level?: number }) {
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
