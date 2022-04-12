import {CliUx} from '@oclif/core'
import {flags} from '@heroku-cli/command'
import color from '@heroku-cli/color'

import {JobExecution, LogSession} from '../../../lib/schema'
import readLogs from '../../../lib/log-displayer'

import {fetchAuthInfo} from '../../../lib/fetcher'
import waitForJobExecution from '../../../lib/wait-for-job-execution'

import BaseCommand, {confirmResource} from '../../../lib/base'

export default class JobsRun extends BaseCommand {
  static description = 'trigger job execution on Cron To Go\nRead more about this feature at https://devcenter.heroku.com/articles/crontogo'

  static examples = [
    '$ heroku cron:jobs:run 01234567-89ab-cdef-0123-456789abcdef -a your-app',
    '$ heroku cron:jobs:run 01234567-89ab-cdef-0123-456789abcdef -a your-app --json',
    '$ heroku cron:jobs:run 01234567-89ab-cdef-0123-456789abcdef --app your-app',
    '$ heroku cron:jobs:run 01234567-89ab-cdef-0123-456789abcdef --app your-app --tail',
    '$ heroku cron:jobs:run 01234567-89ab-cdef-0123-456789abcdef --app your-app --tail --confirm 01234567-89ab-cdef-0123-456789abcdef',
  ]

  static aliases = ['cron:jobs:trigger']

  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
    json: flags.boolean({
      description: 'return the results as JSON',
    }),
    tail: flags.boolean({char: 't', description: 'continually stream job logs'}),
    confirm: flags.string({
      description: 'confirms running the job if passed in',
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
    const {args, flags} = this.parse(JobsRun)

    const job = args.job
    const confirm = flags.confirm

    await confirmResource(job, confirm)

    const authInfo = await fetchAuthInfo(this.heroku, flags.app)

    this.api.auth = authInfo.apiKey

    CliUx.ux.action.start('') // This fixes a bug with tests not using stderr context correctly
    CliUx.ux.action.start(`Enqueuing job ${color.cyan(job)} for execution`)
    try {
      const {body: execution} = await this.api.post<JobExecution>(
        `/organizations/${authInfo.organizationId}/jobs/${job}/executions`,
        {
          body: {},
          ...this.api.defaults,
        },
      )

      CliUx.ux.action.stop(`done. ${execution.Id}`)

      if (flags.json) {
        CliUx.ux.styledJSON(execution)
        return
      }

      if (flags.tail) {
        if (execution.Id) {
          // Wait for job execution to kick in
          await waitForJobExecution(authInfo.organizationId, job, execution, this.api)

          const {body: logSession} = await this.api.post<LogSession>(
            `/organizations/${authInfo.organizationId}/jobs/${job}/executions/${execution.Id}/log-sessions`, {
              body: {
                tail: true,
              },
              ...this.api.defaults,
            },
          )
          await readLogs(logSession.logplex_url)
        } else {
          CliUx.ux.log(`The job ${color.green(job)} has been enqueued for execution`)
        }
      } else {
        CliUx.ux.log(`The job ${color.green(job)} has been enqueued for execution`)
        const command = `heroku cron:jobs:logs ${job} --execution ${execution.Id} --app ${flags.app}`
        CliUx.ux.log(`Run ${color.cmd(command)} to view the execution logs`)
      }
    } catch (error: any) {
      CliUx.ux.action.stop(color.red('failed!'))
      CliUx.ux.error(error)
    }
  }
}
