import {CliUx} from '@oclif/core'
import {flags} from '@heroku-cli/command'
import color from '@heroku-cli/color'
import {prompt} from 'inquirer'

import {Job, JobState, DynoSize, ScheduleType, TargetType} from '../../../lib/schema'

import {fetchAuthInfo} from '../../../lib/fetcher'
import BaseCommand from '../../../lib/base'
import ValidationService, {isRateExpression} from '../../../lib/validation-service'

import * as _ from 'lodash'

export default class JobsCreate extends BaseCommand {
  static description = 'create a job on Cron To Go\nRead more about this feature at https://devcenter.heroku.com/articles/crontogo'

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
      description: 'schedule of the job specified using unix-cron or rate expression format. The minimum precision is 1 minute',
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

  static args = []

  async run(): Promise<void> {
    const {flags} = this.parse(JobsCreate)

    const authInfo = await fetchAuthInfo(this.heroku, flags.app)

    this.api.auth = authInfo.apiKey

    try {
      const questions = []
      const validationService = ValidationService.getJobValidationService()

      const validateAnswer = (field, answer) => {
        const validation = validationService.validate({[field]: answer})
        return validation.isValid ? true : validation[field].message
      }

      // Job creation payload
      questions.push({
        type: 'string',
        name: 'nickname',
        message: 'How would you like to name this job (Optional)?',
        validate(input) {
          return validateAnswer('Alias', input)
        },
      }, {
        type: 'string',
        name: 'schedule',
        message: 'What schedule (in Cron or Rate syntax) do you want this job to run at?',
        validate(input) {
          return validateAnswer('ScheduleExpression', input)
        },
      }, {
        type: 'string',
        name: 'timezone',
        message: 'What timezone do you want for this job?',
        default: 'UTC',
        validate(input) {
          return validateAnswer('Timezone', input)
        },
      }, {
        type: 'list',
        name: 'dyno',
        message: 'What Dyno size do you want to be used for this job?',
        choices: Object.values(DynoSize),
        pageSize: Object.values(DynoSize).length,
        default: DynoSize.BASIC,
        loop: false,
        validate(input) {
          return validateAnswer('Target.Size', input)
        },
      }, {
        type: 'string',
        name: 'command',
        message: 'What command do you want this job to execute?',
        validate(input) {
          return validateAnswer('Target.Command', input)
        },
      }, {
        type: 'number',
        name: 'timeout',
        message: 'What is the job duration limit (in seconds)?',
        default: 1800,
        validate(input) {
          return validateAnswer('Target.TimeToLive', input)
        },
      }, {
        type: 'number',
        name: 'retries',
        message: 'What is the job retries limit?',
        default: 2,
        validate(input) {
          return validateAnswer('Retries', input)
        },
      }, {
        type: 'list',
        name: 'state',
        message: 'What state do you want for this job?',
        choices: Object.values(JobState).map(v => ({name: _.capitalize(v), value: v})),
        pageSize: Object.values(JobState).length,
        default: JobState.ENABLED,
        loop: false,
        validate(input) {
          return validateAnswer('State', input)
        },
      })

      const answers: any = await prompt(questions, flags)
      const scheduleType = isRateExpression(answers.schedule) ? ScheduleType.RATE : ScheduleType.CRON

      const jobCreatePayload: Record<string, unknown> = {
        Alias: answers.nickname,
        ScheduleExpression: answers.schedule,
        Timezone: answers.timezone,
        ScheduleType: scheduleType,
        Target: {
          Type: TargetType.DYNO, // Currently, only dyno target type supported
          Size: answers.dyno,
          Command: answers.command,
          TimeToLive: answers.timeout,
        },
        Retries: answers.retries,
        State: answers.state,
      }

      // Validate jobCreatePayload
      const validation = validationService.validate(jobCreatePayload)

      if (validation.isValid) {
        await this.createJob(authInfo.organizationId, flags, jobCreatePayload)
      } else {
        const {message} = _.find(validation, {isInvalid: true})
        // Get first validation error:
        CliUx.ux.error(`${message}\nSee more help with --help`)
      }
    } catch (error: any) {
      CliUx.ux.error(error)
    }
  }

  async createJob(organizationId: string, flags: Record<string, unknown>, job: Record<string, unknown>): Promise<void> {
    let name: string = _.get(job, 'Alias')?.toString() || _.get(job, 'Target.Command')?.toString() || ''
    if (name.length > 16) {
      name = name.slice(0, 16) + '...'
    }

    CliUx.ux.action.start(`Creating job ${color.green(name)}`)

    try {
      const {body: res} = await this.api.post<Job>(
        `/organizations/${organizationId}/jobs`,
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
      CliUx.ux.log(`Successfully created job ${color.cyan(res.Id)}`)
    } catch (error: any) {
      CliUx.ux.action.stop(color.red('failed!'))
      CliUx.ux.error(error)
    }
  }
}
