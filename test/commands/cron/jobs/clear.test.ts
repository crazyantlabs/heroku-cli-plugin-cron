import {expect, test} from '@oclif/test'

const apiKey = '123456'
const app = 'myapp'
const organizationId = '123456'

const configVarsStub = {
  CRONTOGO_API_KEY: apiKey,
  CRONTOGO_ORGANIZATION_ID: organizationId,
}

describe('cron:jobs:clear', () => {
  const testFactory = () => {
    return test
    .nock('https://api.heroku.com', api => api
    .get(`/apps/${app}/config-vars`)
    .reply(200, configVarsStub),
    )
  }

  testFactory()
  .nock('https://api.crontogo.com', api => api
  .get(`/organizations/${organizationId}/jobs`)
  .reply(200, [{Id: '1'}, {Id: '2'}]),
  )
  .nock('https://api.crontogo.com', api => api
  .delete(`/organizations/${organizationId}/jobs/1`)
  .reply(200, {Id: '1'}),
  )
  .nock('https://api.crontogo.com', api => api
  .delete(`/organizations/${organizationId}/jobs/2`)
  .reply(200, {Id: '2'}),
  )
  .stderr()
  .command(['cron:jobs:clear', '--app', app, '--confirm', app])
  .it('clears all jobs successfully', ctx => {
    expect(ctx.stderr).to.contain(`Deleting all jobs from ${organizationId} Cron To Go organization... done`)
  })

  testFactory()
  .nock('https://api.crontogo.com', api => api
  .get(`/organizations/${organizationId}/jobs`)
  .reply(200, []),
  )
  .stderr()
  .command(['cron:jobs:clear', '--app', app, '--confirm', app])
  .it('shows no jobs to delete message', ctx => {
    expect(ctx.stderr).to.contain(`Deleting all jobs from ${organizationId} Cron To Go organization... no jobs to delete`)
  })

  testFactory()
  .nock('https://api.crontogo.com', api => api
  .get(`/organizations/${organizationId}/jobs`)
  .reply(500, {message: 'my-error'}),
  )
  .stderr()
  .command(['cron:jobs:clear', '--app', app, '--confirm', app])
  .catch(error => expect(error.message).to.match(/my-error/))
  .it('fails to clear jobs', ctx => {
    expect(ctx.stderr).to.contain(`Deleting all jobs from ${organizationId} Cron To Go organization... failed`)
  })

  testFactory()
  .nock('https://api.crontogo.com', api => api
  .get(`/organizations/${organizationId}/jobs`)
  .reply(200, [{Id: '1'}, {Id: '2'}]),
  )
  .nock('https://api.crontogo.com', api => api
  .delete(`/organizations/${organizationId}/jobs/1`)
  .reply(500, {message: 'my-error'}),
  )
  .stderr()
  .command(['cron:jobs:clear', '--app', app, '--confirm', app])
  .catch(error => expect(error.message).to.match(/my-error/))
  .it('fails on job deletion failure', ctx => {
    expect(ctx.stderr).to.contain(`Deleting all jobs from ${organizationId} Cron To Go organization... failed!`)
  })

  test
  .stdout()
  .stderr()
  .command(['cron:jobs:clear', '--app', app, '--confirm', 'wrong-confirm'])
  .catch(error => expect(error.message).to.match(/Confirmation .* did not match .*/))
  .it('fails to clear jobs', ctx => {
    expect(ctx.stderr).to.equal('')
    expect(ctx.stdout).to.equal('')
  })
})
