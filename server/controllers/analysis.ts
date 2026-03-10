import { Request, Response } from "express";
import { z, ZodError } from "zod";
import {
  checkSentence,
  saveSentence,
  getAnalysisById,
} from "../services/analysis.js";
import type { AnalysisResult } from "../../src/types/index.js";

const checkSentenceSchema = z.object({
  sentence: z.string().min(3, "Sentence must be at least 3 characters"),
});

const saveSentenceSchema = z.object({
  sentence: z.string().min(1),
  analysis: z.record(z.string(), z.unknown()),
});

export function handleCheckSentence(req: Request, res: Response): void {
  try {
    const { sentence } = checkSentenceSchema.parse(req.body);
    const result = checkSentence(sentence);
    if (result === null) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json(result);
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      res.status(400).json({ error: error.issues[0]?.message ?? "Invalid request" });
      return;
    }
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
}

export function handleSaveSentence(req: Request, res: Response): void {
  try {
    const { sentence, analysis } = saveSentenceSchema.parse(req.body);
    saveSentence(sentence, analysis as AnalysisResult);
    res.json({ success: true });
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      res.status(400).json({ error: error.issues[0]?.message ?? "Invalid request" });
      return;
    }
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
}

export function handleGetAnalysisById(req: Request, res: Response): void {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "id must be a number" });
    return;
  }
  try {
    const result = getAnalysisById(id);
    if (result === null) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json(result);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
}
