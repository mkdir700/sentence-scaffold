import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request, Response } from "express";

vi.mock("../services/feedback.js", () => ({
  getFeedback: vi.fn(),
}));

import { handleGetFeedback } from "./feedback.js";
import { getFeedback } from "../services/feedback.js";

const mockRes = (): Response => {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn(),
  } as unknown as Response;
  return res;
};

const validBody = {
  userTranslation: "Despite the rain, we went out.",
  reference: "Despite the heavy rain, we still went out.",
  hint: "use despite",
  cn: "尽管下雨，我们还是出去了。",
};

describe("handleGetFeedback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when userTranslation is missing", async () => {
    const req = { body: { reference: "x", hint: "x", cn: "x" } } as Request;
    const res = mockRes();
    await handleGetFeedback(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("returns 400 when reference is missing", async () => {
    const req = { body: { userTranslation: "x", hint: "x", cn: "x" } } as Request;
    const res = mockRes();
    await handleGetFeedback(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("returns 400 when hint is missing", async () => {
    const req = { body: { userTranslation: "x", reference: "x", cn: "x" } } as Request;
    const res = mockRes();
    await handleGetFeedback(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("returns 400 when cn is missing", async () => {
    const req = { body: { userTranslation: "x", reference: "x", hint: "x" } } as Request;
    const res = mockRes();
    await handleGetFeedback(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("returns 200 with commentary when all fields provided", async () => {
    vi.mocked(getFeedback).mockResolvedValue({ commentary: "很好" });
    const req = { body: validBody } as Request;
    const res = mockRes();
    await handleGetFeedback(req, res);
    expect(res.json).toHaveBeenCalledWith({ commentary: "很好" });
  });
});
