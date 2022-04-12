import {expect, test} from '@oclif/test'

const apiKey = '123456'
const app = 'myapp'
const organizationId = '123456'
const jobId = 'job-123456'

const configVarsStub = {
  CRONTOGO_API_KEY: apiKey,
  CRONTOGO_ORGANIZATION_ID: organizationId,
}

describe('cron:jobs:delete', () => {
  test
  .nock('https://api.heroku.com', api => api
  .get(`/apps/${app}/config-vars`)
  .reply(200, configVarsStub),
  )
  .nock('https://api.crontogo.com', api => api
  .delete(`/organizations/${organizationId}/jobs/${jobId}`)
  .reply(200, {Id: jobId}),
  )
  .stderr()
  .command(['cron:jobs:delete', jobId, '--app', app, '--confirm', jobId])
  .it('deletes given job successfully', ctx => {
    expect(ctx.stderr).to.contain(`Deleting job ${jobId}... done`)
  })

  test
  .nock('https://api.heroku.com', api => api
  .get(`/apps/${app}/config-vars`)
  .reply(200, configVarsStub),
  )
  .nock('https://api.crontogo.com', api => api
  .delete(`/organizations/${organizationId}/jobs/${jobId}`)
  .reply(500, {message: 'my-error'}),
  )
  .stderr()
  .command(['cron:jobs:delete', jobId, '--app', app, '--confirm', jobId])
  .catch(error => expect(error.message).to.match(/my-error/))
  .it('fails to delete given job', ctx => {
    expect(ctx.stderr).to.contain(`Deleting job ${jobId}... failed!`)
  })

  test
  .stdout()
  .stderr()
  .command(['cron:jobs:delete', jobId, '--app', app, '--confirm', 'wrong-confirm'])
  .catch(error => expect(error.message).to.match(/Confirmation .* did not match .*/))
  .it('fails to delete given job', ctx => {
    expect(ctx.stderr).to.equal('')
    expect(ctx.stdout).to.equal('')
  })
})
