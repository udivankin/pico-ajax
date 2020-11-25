export type PicoAjaxRequestOptions = {
  body?: string;
  headers?: Record<string, string>;
  username?: string;
  password?: string;
  timeout?: number;
  async?: boolean;
  onProgress?: Function;
  responseType?: '' | 'arraybuffer' | 'blob' | 'document' | 'json' | 'text';
  withCredentials?: boolean;
}

export type PicoAjaxResponse = {
  statusCode: number;
  statusMessage: string;
  headers: Record<string, any>|null;
  body: any;
}

export type PicoAjaxResponseError = Error & {
  statusCode: number;
  statusMessage: string;
  headers: Record<string, any>|null;
  body: any;
}

export interface PicoAjaxRequest {
  (url: string, options?: PicoAjaxRequestOptions): Promise<PicoAjaxResponse|PicoAjaxResponseError>;
}

export interface PicoAjax {
  get: PicoAjaxRequest;
  post: PicoAjaxRequest;
  put: PicoAjaxRequest;
  delete: PicoAjaxRequest;
  head: PicoAjaxRequest;
  patch: PicoAjaxRequest;
  connect: PicoAjaxRequest;
  options: PicoAjaxRequest;
  trace?: PicoAjaxRequest;
}

declare const picoAjax: PicoAjax;
export default picoAjax;