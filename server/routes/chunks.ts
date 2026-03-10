import { Router } from "express";
import { handleSaveChunk, handleGetChunks } from "../controllers/chunks.js";

const router = Router();

router.post("/chunks", handleSaveChunk);
router.get("/chunks", handleGetChunks);

export default router;
