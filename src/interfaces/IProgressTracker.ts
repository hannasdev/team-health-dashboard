// src/services/progress/IProgressTracker.ts
export interface IProgressTracker {
  trackProgress: (current: number, total: number, message: string) => void;
  setReportInterval: (interval: number) => void;
}
