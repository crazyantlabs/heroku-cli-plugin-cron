import {expect, test} from '@oclif/test'
import * as logDisplayer from '../../../../src/lib/log-displayer'

const apiKey = '123456'
const app = 'myapp'
const organizationId = '123456'
const jobId = 'job-123456'
const jobExecutionId = 'job-execution-123456'

const configVarsStub = {
  CRONTOGO_API_KEY: apiKey,
  CRONTOGO_ORGANIZATION_ID: organizationId,
}

describe('cron:jobs:logs', () => {
  const testJobFactory = () => {
    return test
    .nock('https://api.heroku.com', api => api
    .get(`/apps/${app}/config-vars`)
    .reply(200, configVarsStub),
    )
    .nock('https://api.crontogo.com', api => api
    .post(`/organizations/${organizationId}/jobs/${jobId}/log-sessions`)
    .reply(200, {logplex_url: 'https://job-123456.com'}),
    )
  }

  const testJobExecutionFactory = () => {
    return test
    .nock('https://api.heroku.com', api => api
    .get(`/apps/${app}/config-vars`)
    .reply(200, configVarsStub),
    )
    .nock('https://api.crontogo.com', api => api
    .post(`/organizations/${organizationId}/jobs/${jobId}/executions/${jobExecutionId}/log-sessions`)
    .reply(200, {logplex_url: 'https://job-executiom-123456.com'}),
    )
  }

  testJobFactory()
  .stdout()
  .stderr()
  .stub(logDisplayer, 'default', () => '')
  .command(['cron:jobs:logs', jobId, '--app', app])
  .it('streams job logs', ctx => {
    expect(ctx.stderr).to.equal('')
  })

  testJobExecutionFactory()
  .stdout()
  .stderr()
  .stub(logDisplayer, 'default', () => '')
  .command(['cron:jobs:logs', jobId, '--app', app, '--execution', jobExecutionId])
  .it('streams job execution logs', ctx => {
    expect(ctx.stderr).to.equal('')
  })

  test
  .nock('https://api.heroku.com', api => api
  .get(`/apps/${app}/config-vars`)
  .reply(200, configVarsStub),
  )
  .nock('https://api.crontogo.com', api => api
  .post(`/organizations/${organizationId}/jobs/${jobId}/log-sessions`)
  .reply(500, {message: 'my-error'}),
  )
  .stderr()
  .command(['cron:jobs:logs', jobId, '--app', app])
  .catch(error => expect(error.message).to.match(/my-error/))
  .it('fails to stream job logs', ctx => {
    expect(ctx.stderr).to.equal('')
  })
})
