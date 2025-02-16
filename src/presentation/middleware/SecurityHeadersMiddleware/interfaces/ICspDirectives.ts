export interface ICspDirectives {
  defaultSrc?: string[];
  scriptSrc?: string[];
  styleSrc?: string[];
  imgSrc?: string[];
  fontSrc?: string[];
  baseUri?: string[];
  formAction?: string[];
  frameAncestors?: string[];
  objectSrc?: string[];
  [key: string]: string[] | undefined;
}
