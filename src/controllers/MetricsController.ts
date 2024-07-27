// src/controllers/MetricsController.ts
import { Request, Response } from "express";
import { MetricsService } from "../services/MetricsService";

export class MetricsController {
  constructor(private metricsService: MetricsService) {}

  async getMetrics(req: Request, res: Response): Promise<void> {
    try {
      const metrics = await this.metricsService.getMetrics();
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch metrics" });
    }
  }
}
