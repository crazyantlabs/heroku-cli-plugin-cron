// https://github.com/heroku/cli/blob/master/packages/run/src/commands/logs.ts
import * as EventSource from 'eventsource'
import {CliUx} from '@oclif/core'
import HTTP from 'http-call'

import colorize from './colorize'
import liner from './line-transform'

async function readLogsV1(logplexURL: string): Promise<void> {
  const {response} = await HTTP.stream(logplexURL)
  return new Promise(function (resolve, reject) {
    response.setEncoding('utf8')
    liner.setEncoding('utf8')
    response.pipe(liner)
    liner.on('data', (line: string) => CliUx.ux.log(colorize(line)))
    response.on('end', resolve)
    response.on('error', reject)
  })
}

function readLogsV2(logplexURL: string): Promise<void> {
  return new Promise<void>(function (resolve, reject) {
    const u = new URL(logplexURL)
    const isTail = u.searchParams.get('tail') === 'true'
    const userAgent = process.env.HEROKU_DEBUG_USER_AGENT || 'heroku-run'
    const proxy = process.env.https_proxy || process.env.HTTPS_PROXY
    const es = new EventSource(logplexURL, {
      proxy,
      headers: {
        'User-Agent': userAgent,
      },
    })

    es.addEventListener('error', function (err: any) {
      if (err && (err.status || err.message)) {
        const msg = (isTail && (err.status === 404 || err.status === 403)) ?
          'Log stream timed out. Please try again.' :
          `Logs eventsource failed with: ${err.status} ${err.message}`
        reject(msg)
        es.close()
      }

      if (!isTail) {
        resolve()
        es.close()
      }

      // should only land here if --tail and no error status or message
    })

    es.addEventListener('message', function (e: any) {
      for (const line of e.data.trim().split(/\n+/)) {
        CliUx.ux.log(colorize(line))
      }
    })
  })
}

function readLogs(logplexURL: string): Promise<void> {
  const u = new URL(logplexURL)

  if (u.searchParams.has('srv')) {
    return readLogsV1(logplexURL)
  }

  return readLogsV2(logplexURL)
}

export default readLogs
