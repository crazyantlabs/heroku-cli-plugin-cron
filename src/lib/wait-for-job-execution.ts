import {color} from '@heroku-cli/color'
import {CliUx} from '@oclif/core'
import {APIClient} from './api-client'
import {JobExecution, JobExecutionState} from './schema'

export default async function waitForJobExecution(organizationId: string, jobId: string, execution: JobExecution, api: APIClient): Promise<void> {
  CliUx.ux.action.start(`Waiting for ${color.green(execution.Id)} execution to start`)
  while (execution.State === JobExecutionState.PENDING) {
    // Show execution status
    CliUx.ux.action.status = execution.State

    /* eslint-disable-next-line no-await-in-loop */
    await CliUx.ux.wait(2000)
    try {
      /* eslint-disable-next-line no-await-in-loop */
      const {body: res} = await api.get<JobExecution>(
        `/organizations/${organizationId}/jobs/${jobId}/executions/${execution.Id}`,
        api.defaults,
      )
      execution = res
    } catch (error: any) {
      if (error.statusCode === 404) {
        // the API sometimes responds with a 404 when the execution is not yet running. Ignore.
      } else {
        throw error
      }
    }
  }

  CliUx.ux.action.stop(execution.State)
  if (execution.State === JobExecutionState.RUNNING || execution.State === JobExecutionState.SUCCEEDED) return
  throw new Error(`The execution finished with state ${execution.State}`)
}
