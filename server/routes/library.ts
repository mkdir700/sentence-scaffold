import { Router } from "express";
import {
  handleSaveToLibrary,
  handleGetSaved,
  handleGetHistory,
} from "../controllers/library.js";

const router = Router();

router.post("/save", handleSaveToLibrary);
router.get("/saved", handleGetSaved);
router.get("/history", handleGetHistory);

export default router;
