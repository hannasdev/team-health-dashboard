// src/services/MetricsService.ts
import { injectable, inject } from 'inversify';

import {
  IMetricsService,
  IMetric,
  IDataSource,
  IMetricCalculator,
  IFetchDataResult,
  IMetricsResult,
  IStats,
  IError,
} from '@/interfaces';
import { ProgressCallback } from '@/types';
import { Logger } from '@/utils/Logger';
import { TYPES } from '@/utils/types';

@injectable()
export class MetricsService implements IMetricsService {
  constructor(
    @inject(TYPES.DataSources) private dataSources: IDataSource[],
    @inject(TYPES.MetricCalculators)
    private metricCalculators: IMetricCalculator[],
    @inject(TYPES.Logger) private logger: Logger,
  ) {
    if (this.dataSources.length !== this.metricCalculators.length) {
      throw new Error(
        'Mismatch between number of data sources and metric calculators',
      );
    }
  }

  async getAllMetrics(
    progressCallback?: ProgressCallback,
  ): Promise<IMetricsResult> {
    const totalSources = this.dataSources.length;
    const results: IFetchDataResult[] = [];
    const errors: IError[] = [];

    for (let i = 0; i < totalSources; i++) {
      const source = this.dataSources[i];
      const calculator = this.metricCalculators[i];
      const sourceProgressCallback: ProgressCallback = (
        current,
        total,
        message,
      ) => {
        const overallProgress =
          (i * 100 + (current / total) * 100) / totalSources;
        progressCallback?.(
          overallProgress,
          100,
          `${source.constructor.name}: ${message}`,
        );
      };

      try {
        const result = await source.fetchData(sourceProgressCallback);
        const calculatedMetrics = calculator.calculateMetrics(result.metrics);
        results.push({ ...result, metrics: calculatedMetrics });
        errors.push(...result.errors);
      } catch (error) {
        this.logger.error(
          `Error fetching data from ${source.constructor.name}:`,
          error as Error,
        );
        errors.push({
          source: source.constructor.name,
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    const allMetrics = results.flatMap(result => result.metrics);
    const aggregatedStats = this.aggregateStats(results);

    return {
      metrics: this.deduplicateMetrics(allMetrics),
      errors,
      stats: aggregatedStats,
    };
  }

  // async getAllMetrics(
  //   progressCallback?: ProgressCallback,
  //   timePeriod: number = 90,
  // ): Promise<{
  //   metrics: IMetric[];
  //   errors: { source: string; message: string }[];
  //   githubStats: { totalPRs: number; fetchedPRs: number; timePeriod: number };
  // }> {
  //   const errors: { source: string; message: string }[] = [];
  //   let allMetrics: IMetric[] = [];
  //   let githubStats = { totalPRs: 0, fetchedPRs: 0, timePeriod };

  //   const createGoogleSheetsProgressCallback = (
  //     source: string,
  //     offset: number,
  //   ) => {
  //     return (progress: number, message: string) => {
  //       const adjustedProgress = offset + (progress / 100) * 50;
  //       progressCallback?.(adjustedProgress, 100, `${source}: ${message}`);
  //     };
  //   };

  //   const createGitHubProgressCallback = (
  //     source: string,
  //     offset: number,
  //   ): ProgressCallback => {
  //     return (current: number, total: number, message: string) => {
  //       const adjustedProgress = offset + (current / total) * 50;
  //       progressCallback?.(adjustedProgress, 100, `${source}: ${message}`);
  //     };
  //   };

  //   try {
  //     progressCallback?.(0, 100, 'Google Sheets: Starting to fetch data');
  //     const googleSheetsData = await this.googleSheetsService.fetchData(
  //       createGoogleSheetsProgressCallback('Google Sheets', 0),
  //     );
  //     allMetrics = [...allMetrics, ...googleSheetsData];
  //     progressCallback?.(50, 100, 'Google Sheets: Finished fetching data');
  //   } catch (error) {
  //     this.logger.error('Error fetching Google Sheets data:', error as Error);
  //     errors.push({
  //       source: 'Google Sheets',
  //       message: error instanceof Error ? error.message : 'Unknown error',
  //     });
  //   }

  //   try {
  //     progressCallback?.(50, 100, 'GitHub: Starting to fetch data');
  //     const githubData = await this.gitHubService.fetchData(
  //       createGitHubProgressCallback('GitHub', 50),
  //       timePeriod,
  //     );
  //     allMetrics = [...allMetrics, ...githubData.metrics];
  //     githubStats = {
  //       totalPRs: githubData.totalPRs,
  //       fetchedPRs: githubData.fetchedPRs,
  //       timePeriod: githubData.timePeriod,
  //     };
  //     progressCallback?.(100, 100, 'GitHub: Finished fetching data');
  //   } catch (error) {
  //     this.logger.error('Error fetching GitHub data:', error as Error);
  //     errors.push({
  //       source: 'GitHub',
  //       message: error instanceof Error ? error.message : 'Unknown error',
  //     });
  //   }

  //   const uniqueMetrics = this.deduplicateMetrics(allMetrics);

  //   return { metrics: uniqueMetrics, errors, githubStats };
  // }

  private deduplicateMetrics(metrics: IMetric[]): IMetric[] {
    const metricMap = new Map<string, IMetric>();

    for (const metric of metrics) {
      const existingMetric = metricMap.get(metric.id);
      if (!existingMetric || existingMetric.timestamp < metric.timestamp) {
        metricMap.set(metric.id, metric);
      }
    }

    return Array.from(metricMap.values());
  }

  private aggregateStats(results: IFetchDataResult[]): IStats {
    // Implementation
  }
}
