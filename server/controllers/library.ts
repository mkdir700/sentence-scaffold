import { Request, Response } from "express";
import { z, ZodError } from "zod";
import {
  saveToLibrary,
  getSaved,
  getHistory,
} from "../services/library.js";

const saveToLibrarySchema = z.object({
  sentence: z.string().min(1),
});

export function handleSaveToLibrary(req: Request, res: Response): void {
  try {
    const { sentence } = saveToLibrarySchema.parse(req.body);
    const result = saveToLibrary(sentence);
    if (!result.success) {
      res.status(404).json({ error: result.message ?? "Not found" });
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

export function handleGetSaved(_req: Request, res: Response): void {
  try {
    const saved = getSaved();
    res.json(saved);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
}

export function handleGetHistory(_req: Request, res: Response): void {
  try {
    const history = getHistory();
    res.json(history);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
}
