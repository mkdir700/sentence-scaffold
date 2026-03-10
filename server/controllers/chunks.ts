import { Request, Response } from "express";
import { z, ZodError } from "zod";
import { saveChunk, getChunks } from "../services/chunks.js";

const saveChunkSchema = z.object({
  expression: z.string().min(1),
  meaning: z.string().min(1),
  examples: z.array(z.string()),
});

export function handleSaveChunk(req: Request, res: Response): void {
  try {
    const { expression, meaning, examples } = saveChunkSchema.parse(req.body);
    saveChunk(expression, meaning, examples);
    res.json({ success: true });
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      res.status(400).json({ error: error.issues[0]?.message ?? "Invalid request" });
      return;
    }
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
}

export function handleGetChunks(_req: Request, res: Response): void {
  try {
    const chunks = getChunks();
    res.json(chunks);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
}
