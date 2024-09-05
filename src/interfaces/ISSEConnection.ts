// src/interfaces/ISSEConnection.ts

export interface ISSEConnection {
  sendEvent(event: string, data: any): void;
  end(): void;
  handleError(error: Error): void;
}
