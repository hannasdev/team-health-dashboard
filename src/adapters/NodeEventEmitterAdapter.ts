// src/adapters/NodeEventEmitterAdapter.ts
import { EventEmitter } from 'events';

import { injectable } from 'inversify';

import type { IEventEmitter } from '../interfaces/index.js';

@injectable()
export class NodeEventEmitterAdapter implements IEventEmitter {
  private emitter = new EventEmitter();

  on(event: string | symbol, listener: (...args: any[]) => void): this {
    this.emitter.on(event, listener);
    return this;
  }

  emit(event: string | symbol, ...args: any[]): boolean {
    return this.emitter.emit(event, ...args);
  }

  removeListener(
    event: string | symbol,
    listener: (...args: any[]) => void,
  ): this {
    this.emitter.removeListener(event, listener);
    return this;
  }

  // Implement other methods as needed
}
