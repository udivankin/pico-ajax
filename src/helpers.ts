import {
  PicoAjaxRequestOptions,
  PicoAjaxResponse,
} from './index';

/**
 * Default request options
 */
export const DEFAULT_OPTIONS: PicoAjaxRequestOptions = {
  body: undefined,
  headers: {},
  username: undefined,
  password: undefined,
  timeout: undefined,
  async: true,
  onProgress: null,
  responseType: '',
  withCredentials: undefined,
};

/**
 * Try to parse json
 */
export function parseJson(json: string): any {
  let data: any;

  try {
    data = JSON.parse(json);
  } catch (err) {
    data = json;
  }

  return data;
}

export function merge(obj1: object, obj2: object): object {
  return Object.assign({}, obj1, obj2);
}

export class PicoAjaxResponseError extends Error {
  statusCode?: number;
  statusMessage?: string;
  headers?: any;
  body?: Buffer|string|null;
  name = "ReponseError";
  constructor (message: string, response?: PicoAjaxResponse) {
      super(message);
      if (response) {
        this.statusCode = response.statusCode;
        this.statusMessage = response.statusMessage;
        this.headers = response.headers;
        this.body = response.body;
      }
  }
}
