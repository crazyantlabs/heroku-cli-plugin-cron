import {expect, test} from '@oclif/test'

const apiKey = '123456'
const app = 'myapp'
const organizationId = '123456'
const jobId = 'job-123456'

const configVarsStub = {
  CRONTOGO_API_KEY: apiKey,
  CRONTOGO_ORGANIZATION_ID: organizationId,
}

describe('cron:jobs:resume', () => {
  test
  .nock('https://api.heroku.com', api => api
  .get(`/apps/${app}/config-vars`)
  .reply(200, configVarsStub),
  )
  .nock('https://api.crontogo.com', api => api
  .put(`/organizations/${organizationId}/jobs/${jobId}/resume`)
  .reply(200, {Id: jobId}),
  )
  .stderr()
  .command(['cron:jobs:resume', jobId, '--app', app])
  .it('resumes given job successfully', ctx => {
    expect(ctx.stderr).to.contain(`Resuming job ${jobId}... done`)
  })

  test
  .nock('https://api.heroku.com', api => api
  .get(`/apps/${app}/config-vars`)
  .reply(200, configVarsStub),
  )
  .nock('https://api.crontogo.com', api => api
  .put(`/organizations/${organizationId}/jobs/${jobId}/resume`)
  .reply(500, {message: 'my-error'}),
  )
  .stderr()
  .command(['cron:jobs:resume', jobId, '--app', app])
  .catch(error => expect(error.message).to.match(/my-error/))
  .it('fails to resume given job', ctx => {
    expect(ctx.stderr).to.contain(`Resuming job ${jobId}... failed!`)
  })
})
