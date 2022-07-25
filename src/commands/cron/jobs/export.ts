import {CliUx} from '@oclif/core'
import {flags} from '@heroku-cli/command'
import color from '@heroku-cli/color'
import {dump} from 'js-yaml'
import {writeFile} from 'fs-extra'

import {Job, Manifest} from '../../../lib/schema'

import {fetchAuthInfo} from '../../../lib/fetcher'
import BaseCommand from '../../../lib/base'

import * as _ from 'lodash'

export default class JobsExport extends BaseCommand {
  static description = 'export jobs from Cron To Go to a [manifest file](https://github.com/crazyantlabs/heroku-cli-plugin-cron/blob/main/examples/manifest.yml)\n\nRead more about this feature at https://devcenter.heroku.com/articles/crontogo'

  static examples = [
    '$ heroku cron:jobs:export manifest.yml -a your-app',
    '$ heroku cron:jobs:export /tmp/manifest.yml --app your-app',
  ]

  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
  }

  static args = [
    {
      name: 'filename',
      required: true,
      description: 'manifest file path',
    },
  ]

  async run(): Promise<void> {
    const {args, flags} = this.parse(JobsExport)

    const filename = args.filename

    const authInfo = await fetchAuthInfo(this.heroku, flags.app)

    this.api.auth = authInfo.apiKey

    try {
      const {body: jobs} = await this.api.get<Array<Job>>(
        `/organizations/${authInfo.organizationId}/jobs`,
        this.api.defaults,
      )

      const manifest:Manifest = {
        jobs: _.map(jobs, function (job: Job) {
          return {
            nickname: _.get(job, 'Alias'),
            schedule: _.get(job, 'ScheduleExpression'),
            timezone: _.get(job, 'Timezone'),
            dyno: _.get(job, 'Target.Size'),
            command: _.get(job, 'Target.Command'),
            timeout: _.get(job, 'Target.TimeToLive'),
            state: _.get(job, 'State'),
          }
        }),
      }

      CliUx.ux.action.start(`Writing ${color.green(filename)} manifest file for ${color.cyan(authInfo.organizationId)} Cron To Go organization jobs`)

      // Write manifest file
      await writeFile(filename, dump(manifest))

      CliUx.ux.action.stop()
    } catch (error: any) {
      CliUx.ux.error(error)
    }
  }
}
