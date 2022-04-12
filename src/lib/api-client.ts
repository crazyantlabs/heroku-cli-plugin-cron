import * as Config from '@oclif/config'
import {CLIError} from '@oclif/errors'
import {HTTP, HTTPError, HTTPRequestOptions} from 'http-call'

import {deps} from './deps'
import {vars} from './vars'

export namespace APIClient {
  export interface Options extends HTTPRequestOptions {
    retryAuth?: boolean
  }
}

export interface IOptions {
  required?: boolean
}

export interface IAPIErrorOptions {
  id?: string
  message?: string
}

export class APIError extends CLIError {
  http: HTTPError
  body: IAPIErrorOptions

  constructor(httpError: HTTPError) {
    if (!httpError) throw new Error('invalid error')
    const options: IAPIErrorOptions = httpError.body
    if (!options || !options.message) throw httpError
    const info = []
    if (options.id) info.push(`Error ID: ${options.id}`)
    if (info.length > 0) super([options.message, '', ...info].join('\n'))
    else super(options.message)
    this.http = httpError
    this.body = options
  }
}

export class APIClient {
  http: typeof HTTP
  private _auth?: string

  constructor(protected config: Config.IConfig, public options: IOptions = {}) {
    this.config = config
    if (options.required === undefined) options.required = true
    this.options = options
    const apiUrl = new URL(vars.apiUrl)
    const envHeaders = JSON.parse(process.env.CRONTOGO_HEADERS || '{}')
    const self = this as any
    const opts = {
      host: apiUrl.hostname,
      port: apiUrl.port,
      protocol: apiUrl.protocol,
      headers: {
        accept: 'application/json',
        'user-agent': `heroku-cli-plugin-cron/${self.config.version} ${self.config.platform}`,
        ...envHeaders,
      },
    }
    this.http = class APIHTTPClient<T> extends deps.HTTP.HTTP.create(opts)<T> {
      static async request<T>(url: string, opts: APIClient.Options = {}, retries = 3): Promise<APIHTTPClient<T>> {
        opts.headers = opts.headers || {}

        if (!Object.keys(opts.headers).some(h => h.toLowerCase() === 'authorization')) {
          opts.headers.authorization = `Bearer ${self.auth}`
        }

        retries--
        try {
          const response = await super.request<T>(url, opts)
          return response
        } catch (error) {
          if (!(error instanceof deps.HTTP.HTTPError)) throw error
          if (retries > 0 && opts.retryAuth !== false && error.http.statusCode === 401 && error.body.message === 'Unauthorized') {
            if (process.env.CRONTOGO_API_KEY) {
              throw new Error('The API key provided with CRONTOGO_API_KEY is invalid. Please double-check that you have the correct API key.')
            }

            opts.headers.authorization = `Bearer ${self.auth}`
            return this.request<T>(url, opts, retries)
          }

          throw new APIError(error)
        }
      }
    }
  }

  get auth(): string | undefined {
    if (!this._auth) {
      this._auth = process.env.CRONTOGO_API_KEY
    }

    return this._auth
  }

  set auth(apiKey: string | undefined) {
    this._auth = apiKey
  }

  get<T>(url: string, options: APIClient.Options = {}): Promise<HTTP<T>> {
    return this.http.get<T>(url, options)
  }

  post<T>(url: string, options: APIClient.Options = {}): Promise<HTTP<T>> {
    return this.http.post<T>(url, options)
  }

  put<T>(url: string, options: APIClient.Options = {}): Promise<HTTP<T>> {
    return this.http.put<T>(url, options)
  }

  patch<T>(url: string, options: APIClient.Options = {}): Promise<HTTP<T>> {
    return this.http.patch<T>(url, options)
  }

  delete<T>(url: string, options: APIClient.Options = {}): Promise<HTTP<T>> {
    return this.http.delete<T>(url, options)
  }

  stream(url: string, options: APIClient.Options = {}): Promise<unknown> {
    return this.http.stream(url, options)
  }

  request<T>(url: string, options: APIClient.Options = {}): Promise<HTTP<T>> {
    return this.http.request<T>(url, options)
  }

  get defaults(): typeof HTTP.defaults {
    return this.http.defaults
  }
}
