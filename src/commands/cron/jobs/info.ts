import {CliUx} from '@oclif/core'
import {flags} from '@heroku-cli/command'
import color from '@heroku-cli/color'

import {Job, JobState, JobExecutionState} from '../../../lib/schema'

import formatDate from '../../../lib/format-date'
import {fetchAuthInfo} from '../../../lib/fetcher'
import BaseCommand from '../../../lib/base'

import * as _ from 'lodash'

export default class JobsInfo extends BaseCommand {
  static description = 'get information about a job on Cron To Go\nRead more about this feature at https://devcenter.heroku.com/articles/crontogo'

  static examples = [
    '$ heroku cron:jobs:info 01234567-89ab-cdef-0123-456789abcdef -a your-app',
    '$ heroku cron:jobs:info 01234567-89ab-cdef-0123-456789abcdef --app your-app --json',
  ]

  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
    json: flags.boolean({
      description: 'return the results as JSON',
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
    const {args, flags} = this.parse(JobsInfo)

    const job = args.job

    const authInfo = await fetchAuthInfo(this.heroku, flags.app)

    this.api.auth = authInfo.apiKey

    try {
      const {body: res} = await this.api.get<Job>(
        `/organizations/${authInfo.organizationId}/jobs/${job}`,
        this.api.defaults,
      )

      if (flags.json) {
        CliUx.ux.styledJSON(res)
        return
      }

      CliUx.ux.styledHeader(`Job info for ${color.cyan(job)}`)

      CliUx.ux.styledObject({
        Nickname: res.Alias,
        State: res.State === JobState.ENABLED ? color.green(res.State) : color.gray(res.State),
        Schedule: res.ScheduleExpression,
        Timezone: res.Timezone,
        Created: formatDate(res.CreatedAt),
        Updated: formatDate(res.UpdatedAt),
      })

      if (res.Target) {
        const target = res.Target

        CliUx.ux.log()
        CliUx.ux.styledHeader('Target')
        CliUx.ux.styledObject({
          Timeout: target.TimeToLive,
          Command: target.Command || '-',
          Dyno: target.Size,
        })
      }

      if (res.LastAttempt) {
        const lastAttempt = res.LastAttempt

        let stateColor = 'gray'
        switch (lastAttempt.State) {
        case JobExecutionState.SUCCEEDED:
          stateColor = 'green'
          break
        case JobExecutionState.FAILED:
          stateColor = 'red'
          break
        case JobExecutionState.RUNNING:
          stateColor = 'cyan'
          break
        }

        CliUx.ux.log()
        CliUx.ux.styledHeader('Last run')
        CliUx.ux.styledObject({
          Id: lastAttempt.Id,
          Status: _.get(color, stateColor)(lastAttempt.State),
          Date: formatDate(lastAttempt.CreatedAt),
        })
      }
    } catch (error: any) {
      CliUx.ux.error(error)
    }
  }
}
