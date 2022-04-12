import {CliUx} from '@oclif/core'
import {flags} from '@heroku-cli/command'
import color from '@heroku-cli/color'

import {Job} from '../../../lib/schema'

import {fetchAuthInfo} from '../../../lib/fetcher'
import BaseCommand, {confirmResource} from '../../../lib/base'

import * as _ from 'lodash'

export default class JobsClear extends BaseCommand {
  static description = 'delete all jobs on Cron To Go\nRead more about this feature at https://devcenter.heroku.com/articles/crontogo'

  static examples = [
    '$ heroku cron:jobs:clear -a your-app',
    '$ heroku cron:jobs:clear --app your-app',
    '$ heroku cron:jobs:clear --app your-app --confirm your-app',
  ]

  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
    confirm: flags.string({
      description: 'confirms deleting all jobs if passed in',
      required: false,
      default: '',
    }),
  }

  async run(): Promise<void> {
    const {flags} = this.parse(JobsClear)

    const confirm = flags.confirm

    await confirmResource(flags.app, confirm)

    const authInfo = await fetchAuthInfo(this.heroku, flags.app)

    this.api.auth = authInfo.apiKey
    await this.deleteAllJobs(authInfo.organizationId)
  }

  async deleteAllJobs(organizationId: string): Promise<void> {
    CliUx.ux.action.start(`Deleting all jobs from ${color.cyan(organizationId)} Cron To Go organization`)

    try {
      const {body: jobs} = await this.api.get<Array<Job>>(
        `/organizations/${organizationId}/jobs`,
        this.api.defaults,
      )

      const deleteJob = this.deleteJob.bind(this)
      if (jobs && jobs.length > 0) {
        let successful = 0

        // Delete jobs in chunks of 10 to prevent rate limitations
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
      } else {
        CliUx.ux.action.stop('no jobs to delete')
      }
    } catch (error: any) {
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
    } catch (error: any) {
      CliUx.ux.error(error)
    }
  }
}
