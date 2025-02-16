import type { ISecurityEvent } from './ISecurityEvent';
import type { IEnhancedRequest } from '../../interfaces/index.js';

export interface ISecurityRequest extends IEnhancedRequest {
  securityEvent?: ISecurityEvent;
  'user-agent': string;
  authorization?: string;
  'x-api-key'?: string;
  cookie?: string;
}
