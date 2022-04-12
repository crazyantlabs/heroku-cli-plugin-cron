import {expect, test} from '@oclif/test'

const apiKey = '123456'
const app = 'myapp'
const organizationId = '123456'
const jobId = 'job-123456'

const configVarsStub = {
  CRONTOGO_API_KEY: apiKey,
  CRONTOGO_ORGANIZATION_ID: organizationId,
}

describe('cron:jobs:pause', () => {
  test
  .nock('https://api.heroku.com', api => api
  .get(`/apps/${app}/config-vars`)
  .reply(200, configVarsStub),
  )
  .nock('https://api.crontogo.com', api => api
  .put(`/organizations/${organizationId}/jobs/${jobId}/pause`)
  .reply(200, {Id: jobId}),
  )
  .stderr()
  .command(['cron:jobs:pause', jobId, '--app', app])
  .it('pauses given job successfully', ctx => {
    expect(ctx.stderr).to.contain(`Pausing job ${jobId}... done`)
  })

  test
  .nock('https://api.heroku.com', api => api
  .get(`/apps/${app}/config-vars`)
  .reply(200, configVarsStub),
  )
  .nock('https://api.crontogo.com', api => api
  .put(`/organizations/${organizationId}/jobs/${jobId}/pause`)
  .reply(500, {message: 'my-error'}),
  )
  .stderr()
  .command(['cron:jobs:pause', jobId, '--app', app])
  .catch(error => expect(error.message).to.match(/my-error/))
  .it('fails to pause given job', ctx => {
    expect(ctx.stderr).to.contain(`Pausing job ${jobId}... failed!`)
  })
})
