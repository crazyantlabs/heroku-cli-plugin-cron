import {CliUx} from '@oclif/core'
import {flags} from '@heroku-cli/command'
import color from '@heroku-cli/color'

import {Job, JobState, DynoSize} from '../../../lib/schema'

import {fetchAuthInfo} from '../../../lib/fetcher'
import BaseCommand from '../../../lib/base'
import ValidationService from '../../../lib/validation-service'

import * as _ from 'lodash'

export default class JobsUpdate extends BaseCommand {
  static description = 'update a job on Cron To Go\nRead more about this feature at https://devcenter.heroku.com/articles/crontogo'

  static examples = [
    '$ heroku cron:jobs:create -a your-app',
    '$ heroku cron:jobs:create --app your-app',
  ]

  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
    json: flags.boolean({
      description: 'return the results as JSON',
    }),
    nickname: flags.string({
      description: 'nickname of the job. Leave blank to use the job command',
      required: false,
    }),
    schedule: flags.string({
      description: 'schedule of the job specified using unix-cron format. The minimum precision is 1 minute',
      required: false,
    }),
    timezone: flags.string({
      description: 'time zone of the job. UTC time zone is recommended for avoiding daylight savings time issues',
      required: false,
    }),
    command: flags.string({
      description: 'command to run as a one-off dyno either as the command to execute, or a process type that is present in your apps\'s Procfile',
      required: false,
    }),
    dyno: flags.string({
      description: 'size of the one-off dyno',
      required: false,
      options: Object.values(DynoSize),
    }),
    timeout: flags.integer({
      description: 'number of seconds until the one-off dyno expires, after which it will soon be killed',
      required: false,
    }),
    state: flags.string({
      description: 'state of the job',
      required: false,
      options: Object.values(JobState),
    }),
    retries: flags.integer({
      description: 'number of attempts to make to run a job using the exponential back-off procedure',
      required: false,
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
    const {args, flags} = this.parse(JobsUpdate)

    const job = args.job

    const authInfo = await fetchAuthInfo(this.heroku, flags.app)

    this.api.auth = authInfo.apiKey

    try {
      // Job update payload
      const jobUpdatePayload: Record<string, unknown> = {}

      if (_.has(flags, 'nickname')) _.set(jobUpdatePayload, 'Alias', flags.nickname)
      if (_.has(flags, 'schedule')) _.set(jobUpdatePayload, 'ScheduleExpression', flags.schedule)
      if (_.has(flags, 'timezone')) _.set(jobUpdatePayload, 'Timezone', flags.timezone)
      if (_.has(flags, 'dyno')) _.set(jobUpdatePayload, 'Target.Size', flags.dyno)
      if (_.has(flags, 'command')) _.set(jobUpdatePayload, 'Target.Command', flags.command)
      if (_.has(flags, 'timeout')) _.set(jobUpdatePayload, 'Target.TimeToLive', flags.timeout)
      if (_.has(flags, 'state')) _.set(jobUpdatePayload, 'State', flags.state)
      if (_.has(flags, 'retries')) _.set(jobUpdatePayload, 'Retries', flags.retries)

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
