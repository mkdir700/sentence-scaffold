import { z } from "zod";

export const ComponentSchema = z.object({
  text: z.string(),
  role: z.string(),
  modifies: z.string().optional(),
  explains: z.string().optional(),
});

const StructureNodeSchema = z.object({
  label: z.string(),
  children: z
    .array(
      z.object({
        label: z.string(),
      })
    )
    .optional(),
});

export const AnalysisResultSchema = z.object({
  sentence: z.string(),
  sentence_type: z.object({
    category: z.string(),
    summary: z.string(),
  }),
  main_clause: z.object({
    subject: z.string(),
    verb: z.string(),
    complement: z.string().optional(),
  }),
  core_skeleton: z.string(),
  components: z.array(ComponentSchema),
  structure_tree: z.array(StructureNodeSchema),
  meaning: z.object({
    literal_cn: z.string(),
    natural_cn: z.string(),
  }),
  key_points: z.array(z.object({ point: z.string() })),
  chunks: z.array(
    z.object({
      expression: z.string(),
      meaning: z.string(),
      examples: z.array(z.string()),
    })
  ),
  review_summary: z.object({
    look_first: z.string(),
    easy_to_misread: z.string(),
    how_to_parse_next_time: z.string(),
  }),
  practice: z.object({
    scenario: z.string(),
    tasks: z.array(z.object({
      cn: z.string(),
      hint: z.string(),
      reference: z.string(),
    })).min(2).max(3),
  }),
});

// Single source of truth: TypeScript type derived from schema
export type AnalysisResult = z.infer<typeof AnalysisResultSchema>;
