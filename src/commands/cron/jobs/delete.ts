import {CliUx} from '@oclif/core'
import {flags} from '@heroku-cli/command'
import color from '@heroku-cli/color'

import {Job} from '../../../lib/schema'

import {fetchAuthInfo} from '../../../lib/fetcher'
import BaseCommand, {confirmResource} from '../../../lib/base'

export default class JobsDelete extends BaseCommand {
  static description = 'delete job on Cron To Go\nRead more about this feature at https://devcenter.heroku.com/articles/crontogo'

  static examples = [
    '$ heroku cron:jobs:delete 01234567-89ab-cdef-0123-456789abcdef -a your-app',
    '$ heroku cron:jobs:delete 01234567-89ab-cdef-0123-456789abcdef --app your-app',
    '$ heroku cron:jobs:delete 01234567-89ab-cdef-0123-456789abcdef --app your-app --confirm 01234567-89ab-cdef-0123-456789abcdef',
  ]

  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
    confirm: flags.string({
      description: 'confirms deleting the job if passed in',
      required: false,
      default: '',
    }),
  }

  static args = [
    {
      name: 'job',
      required: true,
      description: 'unique ID of the job',
    },
  ]

  async run(): Promise<void> {
    const {args, flags} = this.parse(JobsDelete)

    const job = args.job
    const confirm = flags.confirm

    await confirmResource(job, confirm)

    const authInfo = await fetchAuthInfo(this.heroku, flags.app)

    this.api.auth = authInfo.apiKey

    CliUx.ux.action.start(`Deleting job ${color.cyan(job)}`)

    try {
      await this.api.delete<Job>(
        `/organizations/${authInfo.organizationId}/jobs/${job}`,
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
