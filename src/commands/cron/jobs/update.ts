import {CliUx} from '@oclif/core'
import color from '@heroku-cli/color'

import {Job, ScheduleType} from '../../../lib/schema'

import {fetchAuthInfo} from '../../../lib/fetcher'
import BaseCommand from '../../../lib/base'
import ValidationService, {isRateExpression} from '../../../lib/validation-service'

import * as _ from 'lodash'

import JobsCreate from './create'

export default class JobsUpdate extends BaseCommand {
  static description = 'update a job on Cron To Go\nRead more about this feature at https://devcenter.heroku.com/articles/crontogo'

  static examples = [
    '$ heroku cron:jobs:update -a your-app',
    '$ heroku cron:jobs:update --app your-app',
  ]

  static flags = {
    ...JobsCreate.flags,
  }

  static args = [
    {
      name: 'job',
      required: true,
      description: 'unique ID of the job',
    },
  ]

  async run(): Promise<void> {
    const {args, flags} = this.parse(JobsUpdate)

    const job = args.job

    const authInfo = await fetchAuthInfo(this.heroku, flags.app)

    this.api.auth = authInfo.apiKey

    try {
      // Job update payload
      const jobUpdatePayload: Record<string, unknown> = {}

      if (_.has(flags, 'nickname')) _.set(jobUpdatePayload, 'Alias', flags.nickname)
      if (_.has(flags, 'schedule')) {
        // Set schedule type
        const scheduleType: ScheduleType = isRateExpression(flags.schedule) ? ScheduleType.RATE : ScheduleType.CRON

        _.set(jobUpdatePayload, 'ScheduleExpression', flags.schedule)
        _.set(jobUpdatePayload, 'ScheduleType', scheduleType)
      }

      if (_.has(flags, 'timezone')) _.set(jobUpdatePayload, 'Timezone', flags.timezone)
      if (_.has(flags, 'dyno')) _.set(jobUpdatePayload, 'Target.Size', flags.dyno)
      if (_.has(flags, 'command')) _.set(jobUpdatePayload, 'Target.Command', flags.command)
      if (_.has(flags, 'timeout')) _.set(jobUpdatePayload, 'Target.TimeToLive', flags.timeout)
      if (_.has(flags, 'state')) _.set(jobUpdatePayload, 'State', flags.state)
      if (_.has(flags, 'retries')) _.set(jobUpdatePayload, 'Retries', flags.retries)
      if (_.has(flags, 'jitter')) _.set(jobUpdatePayload, 'Jitter', flags.jitter)

      // Validate jobUpdatePayload
      const validation = ValidationService.getJobValidationService().validate(jobUpdatePayload)

      if (validation.isValid) {
        await this.updateJob(authInfo.organizationId, job, flags, jobUpdatePayload)
      } else {
        const {message} = _.find(validation, {isInvalid: true})
        // Get first validation error:
        CliUx.ux.error(`${message}\nSee more help with --help`)
      }
    } catch (error: any) {
      CliUx.ux.error(error)
    }
  }

  async updateJob(organizationId: string, jobId: string, flags: Record<string, unknown>, job: Record<string, unknown>): Promise<void> {
    CliUx.ux.action.start('') // This fixes a bug with tests not using stderr context correctly
    CliUx.ux.action.start(`Updating job ${color.cyan(jobId)}`)

    try {
      const {body: res} = await this.api.patch<Job>(
        `/organizations/${organizationId}/jobs/${jobId}`,
        {
          body: job,
          ...this.api.defaults,
        },
      )

      CliUx.ux.action.stop()

      if (flags.json) {
        CliUx.ux.styledJSON(res)
        return
      }

      CliUx.ux.log()
      CliUx.ux.log(`Successfully updated job ${color.cyan(res.Id)}`)
    } catch (error: any) {
      CliUx.ux.action.stop(color.red('failed!'))
      CliUx.ux.error(error)
    }
  }
}
