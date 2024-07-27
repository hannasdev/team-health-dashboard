// src/app.ts
import express from "express";
import { MetricsController } from "./controllers/MetricsController";
import { MetricsService } from "./services/MetricsService";
import { GoogleSheetsService } from "./services/GoogleSheetsService";
import { GitHubService } from "./services/GitHubService";

const app = express();

// Set up dependency injection
const googleSheetsService = new GoogleSheetsService();
const gitHubService = new GitHubService();
const metricsService = new MetricsService(googleSheetsService, gitHubService);
const metricsController = new MetricsController(metricsService);

// Set up routes
app.get("/api/metrics", (req, res) => metricsController.getMetrics(req, res));

export default app;
