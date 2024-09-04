// src/interfaces/IEventEmitter.ts
export interface IEventEmitter {
  on(event: string | symbol, listener: (...args: any[]) => void): this;
  emit(event: string | symbol, ...args: any[]): boolean;
  removeListener(
    event: string | symbol,
    listener: (...args: any[]) => void,
  ): this;
  // Add any other EventEmitter methods you need
}
