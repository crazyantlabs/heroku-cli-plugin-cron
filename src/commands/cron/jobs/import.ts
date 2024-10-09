import {CliUx} from '@oclif/core'
import {flags} from '@heroku-cli/command'
import color from '@heroku-cli/color'

import {load} from 'js-yaml'
import {readFile} from 'fs-extra'

import {Job, JobState, DynoSize, ScheduleType, TargetType, Manifest, ManifestJob} from '../../../lib/schema'

import {fetchAuthInfo} from '../../../lib/fetcher'
import BaseCommand, {confirmResource} from '../../../lib/base'
import ValidationService, {isRateExpression} from '../../../lib/validation-service'

import * as _ from 'lodash'
import formatStartDate from '../../../lib/format-start-date'

export default class JobsImport extends BaseCommand {
  static description = 'import jobs into Cron To Go using a [manifest file](https://github.com/crazyantlabs/heroku-cli-plugin-cron/blob/main/examples/manifest.yml)\n\nRead more about this feature at https://devcenter.heroku.com/articles/crontogo'

  static examples = [
    '$ heroku cron:jobs:import manifest.yml -a your-app',
    '$ heroku cron:jobs:import manifest.yml --app your-app',
    '$ heroku cron:jobs:import manifest.yml --app your-app --delete',
    '$ heroku cron:jobs:import manifest.yml --app your-app --delete --confirm your-app',
  ]

  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
    delete: flags.boolean({
      description: 'delete all jobs prior to applying manifest file',
      default: false,
    }),
    confirm: flags.string({
      description: 'confirms deleting all jobs prior to applying manifest file if passed in',
      required: false,
      default: '',
    }),
  }

  static args = [
    {
      name: 'filename',
      required: true,
      description: 'manifest file path',
    },
  ]

  async run(): Promise<void> {
    const {args, flags} = this.parse(JobsImport)

    const filename = args.filename

    const confirm = flags.confirm

    if (flags.delete) {
      await confirmResource(flags.app, confirm)
    }

    const authInfo = await fetchAuthInfo(this.heroku, flags.app)

    this.api.auth = authInfo.apiKey

    try {
      CliUx.ux.action.start(`Reading ${color.green(filename)} manifest file to import to ${color.cyan(authInfo.organizationId)} Cron To Go organization`)

      const manifest: Manifest = await this.readManifest(filename)

      CliUx.ux.action.stop()

      // Start importing manifest jobs
      const jobs = manifest.jobs || []
      if (flags.delete) {
        // Check if any of the jobs has an ID. If so, warn the user that the jobs will be deleted and will be recreated with new IDs
        const hasId = _.some(jobs, 'id')

        if (hasId) {
          CliUx.ux.warn('Some jobs in the manifest file have IDs. Since you requested to delete all jobs, these jobs will be recreated with new IDs.')

          // Remove IDs from jobs
          _.each(jobs, function (job) {
            delete job.id
          })
        }

        await this.deleteAllJobs(authInfo.organizationId)
      }

      await this.importJobs(authInfo.organizationId, jobs)
    } catch (error) {
      CliUx.ux.action.stop(color.red('failed!'))
      CliUx.ux.error(error)
    }
  }

  async readManifest(filename: string): Promise<Manifest> {
    const buffer = await readFile(filename)
    return load(buffer, {filename: filename})
  }

  async importJobs(organizationId: string, jobs:Array<any>): Promise<void>  {
    CliUx.ux.action.start(`Importing jobs to ${color.cyan(organizationId)} Cron To Go organization`)
    if (jobs && jobs.length > 0) {
      let successful = 0
      try {
        // Create or update jobs in chunks of 10 to prevent rate limitations
        const createOrUpdateJob = this.createOrUpdateJob.bind(this)
        for (const chunk of _.chunk(jobs, 10)) {
          const promises = _.map(chunk, async function (job) {
            await createOrUpdateJob(organizationId, job)
            successful++
            CliUx.ux.action.status = `${successful}/${jobs.length} jobs imported`
          })
          /* eslint-disable-next-line no-await-in-loop */
          await Promise.all(promises)
        }

        CliUx.ux.action.stop(`done. ${successful}/${jobs.length} jobs imported`)
      } catch (error) {
        CliUx.ux.action.stop(color.red(`failed! ${successful}/${jobs.length} jobs imported`))
        CliUx.ux.error(error)
      }
    } else {
      CliUx.ux.action.stop('no jobs to import')
    }
  }

  async deleteAllJobs(organizationId: string): Promise<void> {
    CliUx.ux.action.start(`Deleting all jobs from ${color.cyan(organizationId)} Cron To Go organization`)

    try {
      const {body: jobs} = await this.api.get<Array<Job>>(
        `/organizations/${organizationId}/jobs`,
        this.api.defaults,
      )

      if (jobs && jobs.length > 0) {
        let successful = 0

        try {
          // Delete jobs in chunks of 10 to prevent rate limitations
          const deleteJob = this.deleteJob.bind(this)
          for (const chunk of _.chunk(jobs, 10)) {
            const promises = _.map(chunk, async function (job) {
              await deleteJob(organizationId, job)
              successful++
              CliUx.ux.action.status = `${successful}/${jobs.length} jobs deleted`
            })
            /* eslint-disable-next-line no-await-in-loop */
            await Promise.all(promises)
          }

          CliUx.ux.action.stop(`done. ${successful}/${jobs.length} jobs deleted.`)
        } catch (error) {
          CliUx.ux.action.stop(color.red(`failed! ${successful}/${jobs.length} jobs deleted`))
          CliUx.ux.error(error)
        }
      } else {
        CliUx.ux.action.stop('no jobs to delete')
      }
    } catch (error) {
      CliUx.ux.action.stop(color.red('failed!'))
      CliUx.ux.error(error)
    }
  }

  async deleteJob(organizationId: string, job: Job): Promise<void> {
    try {
      await this.api.delete<Job>(
        `/organizations/${organizationId}/jobs/${job.Id}`,
        {
          ...this.api.defaults,
          raw: true,
        },
      )
    } catch (error) {
      CliUx.ux.error(error)
    }
  }

  async createOrUpdateJob(organizationId: string, job: ManifestJob): Promise<void> {
    try {
      // Default job creation payload
      const jobPayload: Record<string, unknown> = {
        Alias: '',
        ScheduleExpression: '',
        Timezone: 'UTC',
        ScheduleType: ScheduleType.CRON, // Cron by default
        Target: {
          Type: TargetType.DYNO, // Currently, only dyno target type supported
          Size: DynoSize.BASIC,
          Command: '',
          TimeToLive: 1800,
        },
        State: JobState.ENABLED,
      }

      if (_.has(job, 'nickname')) _.set(jobPayload, 'Alias', job.nickname)
      if (_.has(job, 'schedule')) {
        // Set schedule type
        const scheduleType: ScheduleType = isRateExpression(job.schedule) ? ScheduleType.RATE : ScheduleType.CRON
        _.set(jobPayload, 'ScheduleExpression', job.schedule)
        _.set(jobPayload, 'ScheduleType', scheduleType)
      }

      if (_.has(job, 'start_date')) _.set(jobPayload, 'StartDate', formatStartDate(job.start_date))
      if (_.has(job, 'timezone')) _.set(jobPayload, 'Timezone', job.timezone)
      if (_.has(job, 'dyno')) _.set(jobPayload, 'Target.Size', job.dyno)
      if (_.has(job, 'command')) _.set(jobPayload, 'Target.Command', job.command)
      if (_.has(job, 'timeout')) _.set(jobPayload, 'Target.TimeToLive', job.timeout)
      if (_.has(job, 'retries')) _.set(jobPayload, 'Retries', job.retries)
      if (_.has(job, 'jitter')) _.set(jobPayload, 'Jitter', job.jitter)
      if (_.has(job, 'state')) _.set(jobPayload, 'State', job.state)

      // Validate jobPayload
      const validation = ValidationService.getJobValidationService().validate(jobPayload)

      if (validation.isValid) {
        // Create or update job
        job.id ? await this.api.patch<Job>(
          `/organizations/${organizationId}/jobs/${job.id}`,
          {
            body: jobPayload,
            ...this.api.defaults,
          },
        ) : await this.api.post<Job>(
          `/organizations/${organizationId}/jobs`,
          {
            body: jobPayload,
            ...this.api.defaults,
          },
        )
      } else {
        const {message} = _.find(validation, {isInvalid: true})
        // Get first validation error:
        CliUx.ux.error(`${message}`)
      }
    } catch (error) {
      CliUx.ux.error(error)
    }
  }
}
