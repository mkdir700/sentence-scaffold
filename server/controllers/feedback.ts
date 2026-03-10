import { Request, Response } from "express";
import { z, ZodError } from "zod";
import { getFeedback } from "../services/feedback.js";

const feedbackSchema = z.object({
  userTranslation: z.string().min(1, "Translation is required"),
  reference: z.string().min(1, "Reference is required"),
  hint: z.string().min(1, "Hint is required"),
  cn: z.string().min(1, "Chinese sentence is required"),
});

export async function handleGetFeedback(req: Request, res: Response): Promise<void> {
  try {
    const { userTranslation, reference, hint, cn } = feedbackSchema.parse(req.body);
    const { commentary } = await getFeedback({ userTranslation, reference, hint, cn });
    res.json({ commentary });
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      res.status(400).json({ error: error.issues[0]?.message ?? "Invalid request" });
      return;
    }
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
}
