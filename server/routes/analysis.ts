import { Router } from "express";
import {
  handleCheckSentence,
  handleSaveSentence,
  handleGetAnalysisById,
} from "../controllers/analysis.js";

const router = Router();

router.post("/check-sentence", handleCheckSentence);
router.post("/save-sentence", handleSaveSentence);
router.get("/analysis/:id", handleGetAnalysisById);

export default router;
