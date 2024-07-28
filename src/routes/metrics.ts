// src/routes/metrics.ts
import express from "express";
import { MetricsController } from "../controllers/MetricsController";
import { MetricsService } from "../services/MetricsService";
import {
  GoogleSheetsService,
  GoogleSheetsAdapter,
} from "../services/GoogleSheetsService";
import { GitHubService, OctokitAdapter } from "../services/GitHubService";

const router = express.Router();

// Environment variables
const GOOGLE_SHEETS_ID = process.env.GOOGLE_SHEETS_ID || "";
const GOOGLE_SHEETS_CLIENT_EMAIL = process.env.GOOGLE_SHEETS_CLIENT_EMAIL || "";
const GOOGLE_SHEETS_PRIVATE_KEY = process.env.GOOGLE_SHEETS_PRIVATE_KEY || "";
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || "";
const GITHUB_OWNER = process.env.GITHUB_OWNER || "";
const GITHUB_REPO = process.env.GITHUB_REPO || "";

// Create adapters
const googleSheetsAdapter = new GoogleSheetsAdapter(
  GOOGLE_SHEETS_CLIENT_EMAIL,
  GOOGLE_SHEETS_PRIVATE_KEY
);
const octokitAdapter = new OctokitAdapter(GITHUB_TOKEN);

// Create services
const googleSheetsService = new GoogleSheetsService(
  googleSheetsAdapter,
  GOOGLE_SHEETS_ID
);
const gitHubService = new GitHubService(
  octokitAdapter,
  GITHUB_OWNER,
  GITHUB_REPO
);

// Create MetricsService
const metricsService = new MetricsService(
  googleSheetsAdapter,
  octokitAdapter,
  GOOGLE_SHEETS_ID,
  GITHUB_OWNER,
  GITHUB_REPO
);

// Create controller
const metricsController = new MetricsController(metricsService);

// Define route
router.get("/metrics", metricsController.getAllMetrics);

export default router;
