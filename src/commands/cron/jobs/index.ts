import {CliUx} from '@oclif/core'
import {flags} from '@heroku-cli/command'
import color from '@heroku-cli/color'

import {Job} from '../../../lib/schema'

import formatDate from '../../../lib/format-date'
import {fetchAuthInfo} from '../../../lib/fetcher'
import BaseCommand from '../../../lib/base'

export default class JobsList extends BaseCommand {
  static description = 'list jobs on Cron To Go\nRead more about this feature at https://devcenter.heroku.com/articles/crontogo'

  static examples = [
    '$ heroku cron:jobs -a your-app',
    '$ heroku cron:jobs --app your-app --json',
    '$ heroku cron:jobs --app=your-app --csv',
  ]

  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
    json: flags.boolean({
      description: 'return the results as JSON',
    }),
    csv: flags.boolean({exclusive: ['no-truncate'], description: 'output in CSV format'}),
    columns: flags.string({description: 'only show provided columns (comma-seperated)'}),
    extended: flags.boolean({char: 'x', description: 'show extra columns'}),
    'no-truncate': flags.boolean({exclusive: ['csv'], description: 'do not truncate output to fit screen'}),
    'no-header': flags.boolean({exclusive: ['csv'], description: 'hide table header from output'}),
  }

  async run(): Promise<void> {
    const {flags} = this.parse(JobsList)

    const authInfo = await fetchAuthInfo(this.heroku, flags.app)

    this.api.auth = authInfo.apiKey

    try {
      const {body: jobs} = await this.api.get<Array<Job>>(
        `/organizations/${authInfo.organizationId}/jobs`,
        this.api.defaults,
      )

      if (flags.json) {
        CliUx.ux.styledJSON(jobs)
        return
      }

      if (jobs && jobs.length > 0) {
        if (!flags.csv) {
          CliUx.ux.styledHeader(`Cron To Go jobs in app ${color.app(flags.app)}`)
        }

        CliUx.ux.table(jobs, {
          Id: {header: 'ID', extended: true},
          Alias: {header: 'Nickname'},
          ScheduleExpression: {header: 'Schedule'},
          Timezone: {header: 'Timezone'},
          State: {header: 'State', get: (job:Job) => {
            return job.State === 'enabled' ? color.green(job.State) : color.gray(job.State)
          }},
          Dyno: {header: 'Dyno', get: (job:Job) => {
            return job.Target.Size || '-'
          }},
          Command: {header: 'Target', get: (job:Job) => {
            return job.Target.Command || '-'
          }},
          Retries: {header: 'Retries', extended: true, get: (job:Job) => {
            return job.Retries || '-'
          }},
          Jitter: {header: 'Jitter', extended: true, get: (job:Job) => {
            return job.Retries || '-'
          }},
          CreatedAt: {header: 'Created', extended: true, get: (job:Job) => {
            return formatDate(job.CreatedAt)
          }},
          UpdatedAt: {header: 'Updated', extended: true, get: (job:Job) => {
            return formatDate(job.UpdatedAt)
          }},
        }, {
          printLine: this.log,
          ...flags, // parsed flags
        })
      } else {
        CliUx.ux.log('You have no jobs.')
      }
    } catch (error: any) {
      CliUx.ux.error(error)
    }
  }
}
