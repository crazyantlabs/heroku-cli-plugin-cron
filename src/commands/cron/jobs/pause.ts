import {CliUx} from '@oclif/core'
import {flags} from '@heroku-cli/command'
import color from '@heroku-cli/color'

import {Job} from '../../../lib/schema'

import {fetchAuthInfo} from '../../../lib/fetcher'
import BaseCommand from '../../../lib/base'

export default class JobsPause extends BaseCommand {
  static description = 'pause job on Cron To Go\nRead more about this feature at https://devcenter.heroku.com/articles/crontogo'

  static examples = [
    '$ heroku cron:jobs:pause 01234567-89ab-cdef-0123-456789abcdef -a your-app',
    '$ heroku cron:jobs:pause 01234567-89ab-cdef-0123-456789abcdef --app your-app',
  ]

  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
  }

  static args = [
    {
      name: 'job',
      required: true,
      description: 'unique ID of the job',
    },
  ]

  async run(): Promise<void> {
    const {args, flags} = this.parse(JobsPause)

    const job = args.job

    const authInfo = await fetchAuthInfo(this.heroku, flags.app)

    this.api.auth = authInfo.apiKey

    CliUx.ux.action.start(`Pausing job ${color.cyan(job)}`)
    try {
      await this.api.put<Job>(
        `/organizations/${authInfo.organizationId}/jobs/${job}/pause`,
        {
          ...this.api.defaults,
          raw: true,
        },
      )

      CliUx.ux.action.stop()
    } catch (error: any) {
      CliUx.ux.action.stop(color.red('failed!'))
      CliUx.ux.error(error)
    }
  }
}
