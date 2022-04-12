import {CliUx} from '@oclif/core'
import {flags} from '@heroku-cli/command'
import color from '@heroku-cli/color'

import {LogSession} from '../../../lib/schema'

import {fetchAuthInfo} from '../../../lib/fetcher'
import BaseCommand from '../../../lib/base'

import readLogs from '../../../lib/log-displayer'

export default class JobsLogs extends BaseCommand {
  static description = 'display job recent log output on Cron To Go\nRead more about this feature at https://devcenter.heroku.com/articles/crontogo'

  static examples = [
    '$ heroku cron:jobs:logs 01234567-89ab-cdef-0123-456789abcdef -a your-app',
    '$ heroku cron:jobs:logs 01234567-89ab-cdef-0123-456789abcdef -a your-app --num 100',
    '$ heroku cron:jobs:logs 01234567-89ab-cdef-0123-456789abcdef --app your-app --tail',
  ]

  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
    execution: flags.string({
      char: 'e',
      description: 'only show output from this job execution',
      required: false,
    }),
    num: flags.integer({char: 'n', description: 'number of lines to display', default: 100}),
    tail: flags.boolean({char: 't', description: 'continually stream logs', default: false}),
    'force-colors': flags.boolean({description: 'force use of colors (even on non-tty output)'}),
  }

  static args = [
    {
      name: 'job',
      required: true,
      description: 'unique ID of the job',
    },
  ]

  async run(): Promise<void> {
    const {args, flags} = this.parse(JobsLogs)

    const job = args.job

    const authInfo = await fetchAuthInfo(this.heroku, flags.app)

    this.api.auth = authInfo.apiKey

    try {
      color.enabled = flags['force-colors'] || color.enabled

      const endpoint: string = flags.execution ?
        `/organizations/${authInfo.organizationId}/jobs/${job}/executions/${flags.execution}/log-sessions` :
        `/organizations/${authInfo.organizationId}/jobs/${job}/log-sessions`

      const {body: res} = await this.api.post<LogSession>(
        endpoint, {
          body: {
            lines: flags.num,
            tail: flags.tail,
          },
          ...this.api.defaults,
        },
      )

      await readLogs(res.logplex_url)
    } catch (error: any) {
      CliUx.ux.error(error)
    }
  }
}
