// src/controllers/MetricsController.ts
import { Request, Response } from "express";
import { IMetricsService } from "../interfaces/IMetricsService";

export class MetricsController {
  constructor(private metricsService: IMetricsService) {}

  public getAllMetrics = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.metricsService.getAllMetrics();

      if (result.errors.length > 0) {
        res.status(207).json({
          success: true,
          data: result.metrics,
          errors: result.errors,
        });
      } else {
        res.status(200).json({
          success: true,
          data: result.metrics,
        });
      }
    } catch (error) {
      console.error("Error in MetricsController:", error);
      res.status(500).json({
        success: false,
        error:
          error instanceof Error ? error.message : "An unknown error occurred",
      });
    }
  };
}
