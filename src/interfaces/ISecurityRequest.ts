import type { IEnhancedRequest } from './IEnhancedRequest';
import type { ISecurityEvent } from './ISecurityEvent';

export interface ISecurityRequest extends IEnhancedRequest {
  securityEvent?: ISecurityEvent;
  'user-agent': string;
  authorization?: string;
  'x-api-key'?: string;
  cookie?: string;
}
