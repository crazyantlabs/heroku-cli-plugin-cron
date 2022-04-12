import {expect, test} from '@oclif/test'
import * as logDisplayer from '../../../../src/lib/log-displayer'
import * as _ from 'lodash'

const apiKey = '123456'
const app = 'myapp'
const organizationId = '123456'
const jobId = 'job-123456'
const jobExecutionId = 'job-execution-123456'

const configVarsStub = {
  CRONTOGO_API_KEY: apiKey,
  CRONTOGO_ORGANIZATION_ID: organizationId,
}

const jobExecutionStub = {
  Id: jobExecutionId,
  JobId: jobId,
  OrganizationId: organizationId,
  State: 'pending',
}

const runningJobExecutionStub = _.merge({}, jobExecutionStub, {State: 'running'})
const runningJobExecutionStubWithNoId = _.merge({}, jobExecutionStub, {Id: null, State: 'running'})

describe('cron:jobs:run', () => {
  const testFactory = () => {
    return test
    .nock('https://api.heroku.com', api => api
    .get(`/apps/${app}/config-vars`)
    .reply(200, configVarsStub),
    )
    .nock('https://api.crontogo.com', api => api
    .post(`/organizations/${organizationId}/jobs/${jobId}/executions`)
    .reply(200, jobExecutionStub),
    )
  }

  testFactory()
  .stderr()
  .stdout()
  .command(['cron:jobs:run', jobId, '--app', app, '--confirm', jobId])
  .it('triggers job execution for a given job successfully', ctx => {
    expect(ctx.stderr).to.contain(`Enqueuing job ${jobId} for execution... done. ${jobExecutionId}`)
    expect(ctx.stdout).to.contain(`The job ${jobId} has been enqueued for execution`)
    expect(ctx.stdout).to.contain(`Run heroku cron:jobs:logs ${jobId} --execution ${jobExecutionId} --app ${app} to view the execution logs`)
  })

  testFactory()
  .stdout()
  .command(['cron:jobs:run', jobId, '--app', app, '--confirm', jobId, '--json'])
  .it('triggers job execution and shows detailed information about Cron To Go job execution in JSON format', ctx => {
    expect(ctx.stdout).to.contain(`"Id": "${jobExecutionId}"`)
    expect(ctx.stdout).to.contain('"State": "pending"')
  })

  testFactory()
  .nock('https://api.crontogo.com', api => api
  .get(`/organizations/${organizationId}/jobs/${jobId}/executions/${jobExecutionId}`)
  .reply(200, runningJobExecutionStub),
  )
  .nock('https://api.crontogo.com', api => api
  .post(`/organizations/${organizationId}/jobs/${jobId}/executions/${jobExecutionId}/log-sessions`)
  .reply(200, {logplex_url: 'https://job-123456.com'}),
  )
  .stderr()
  .stub(logDisplayer, 'default', () => '')
  .command(['cron:jobs:run', jobId, '--app', app, '--confirm', jobId, '--tail'])
  .it('triggers job execution and tails execution logs', ctx => {
    expect(ctx.stderr).to.contain(`Enqueuing job ${jobId} for execution... done`)
    expect(ctx.stderr).to.contain(`Waiting for ${jobExecutionId} execution to start... running`)
  })

  test
  .nock('https://api.heroku.com', api => api
  .get(`/apps/${app}/config-vars`)
  .reply(200, configVarsStub),
  )
  .nock('https://api.crontogo.com', api => api
  .post(`/organizations/${organizationId}/jobs/${jobId}/executions`)
  .reply(200, runningJobExecutionStubWithNoId),
  )
  .stdout()
  .stderr()
  .stub(logDisplayer, 'default', () => '')
  .command(['cron:jobs:run', jobId, '--app', app, '--confirm', jobId, '--tail'])
  .it('triggers job execution and does not tail execution logs', ctx => {
    expect(ctx.stderr).to.contain(`Enqueuing job ${jobId} for execution... done.`)
    expect(ctx.stdout).to.contain(`The job ${jobId} has been enqueued for execution`)
  })

  test
  .nock('https://api.heroku.com', api => api
  .get(`/apps/${app}/config-vars`)
  .reply(200, configVarsStub),
  )
  .nock('https://api.crontogo.com', api => api
  .post(`/organizations/${organizationId}/jobs/${jobId}/executions`)
  .reply(500, {message: 'my-error'}),
  )
  .stderr()
  .command(['cron:jobs:run', jobId, '--app', app, '--confirm', jobId])
  .catch(error => expect(error.message).to.match(/my-error/))
  .it('fails to run given job', ctx => {
    expect(ctx.stderr).to.contain(`Enqueuing job ${jobId} for execution... failed!`)
  })
})
