// src/interfaces/IJwtService.ts

export interface IJwtService {
  sign(payload: object, secretOrPrivateKey: string, options?: object): string;
  verify(token: string, secretOrPublicKey: string): object | string;
  decode(token: string): any;
}
