import { Router } from "express";
import { handleGetFeedback } from "../controllers/feedback.js";

const router = Router();
router.post("/feedback", handleGetFeedback);

export default router;
