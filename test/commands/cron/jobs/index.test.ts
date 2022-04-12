import {expect, test} from '@oclif/test'
// import * as _ from 'lodash'

const apiKey = '123456'
const app = 'myapp'
const organizationId = '123456'

const configVarsStub = {
  CRONTOGO_API_KEY: apiKey,
  CRONTOGO_ORGANIZATION_ID: organizationId,
}

const jobsListStub = [{
  Id: 'job-1',
  Alias: 'my-job-1',
  State: 'enabled',
  Timezone: 'UTC',
  ScheduleExpression: '* * * * *',
  Target: {
    Command: 'my command 1',
    Size: 'Hobby',
    TimeToLive: 30,
  },
  LastAttempt: {
    Id: 'attempt-123456',
    State: 'running',
    CreatedAt: '2020-01-01T12:00:00Z',
  },
  CreatedAt: '2020-01-01T12:00:00Z',
  UpdatedAt: '2020-01-01T12:00:00Z',
}, {
  Id: 'job-2',
  Alias: 'my-job-2',
  State: 'paused',
  Timezone: 'UTC',
  ScheduleExpression: '* * * * *',
  Target: {
    Size: 'Hobby',
    TimeToLive: 30,
  },
  LastAttempt: {
    Id: 'attempt-123456',
    State: 'running',
    CreatedAt: '2020-01-01T12:00:00Z',
  },
  CreatedAt: '2020-01-01T12:00:00Z',
  UpdatedAt: '2020-01-01T12:00:00Z',
}, {
  Id: 'job-3',
  Alias: 'my-job-3',
  State: 'paused',
  Timezone: 'UTC',
  ScheduleExpression: '* * * * *',
  Target: {
    TimeToLive: 30,
    Command: 'my command 3',
  },
  LastAttempt: {
    Id: 'attempt-123456',
    State: 'running',
    CreatedAt: '2020-01-01T12:00:00Z',
  },
  CreatedAt: '2020-01-01T12:00:00Z',
  UpdatedAt: '2020-01-01T12:00:00Z',
}]

describe('cron:jobs', () => {
  const testFactory = () => {
    return test
    .nock('https://api.heroku.com', api => api
    .get(`/apps/${app}/config-vars`)
    .reply(200, configVarsStub),
    )
    .nock('https://api.crontogo.com', api => api
    .get(`/organizations/${organizationId}/jobs`)
    .reply(200, jobsListStub),
    )
  }

  testFactory()
  .stdout()
  .command(['cron:jobs', '--app', app])
  .it('shows detailed information about Cron To Go jobs in table format', ctx => {
    expect(ctx.stdout).to.contain('=== Cron To Go jobs in app')
    expect(ctx.stdout).to.contain('my-job-1 * * * * * UTC      enabled Hobby my command 1')
    expect(ctx.stdout).to.contain('my-job-2 * * * * * UTC      paused  Hobby -')
    expect(ctx.stdout).to.contain('my-job-3 * * * * * UTC      paused  -     my command 3')
  })

  testFactory()
  .stdout()
  .command(['cron:jobs', '--app', app, '--csv'])
  .it('shows detailed information about Cron To Go jobs in CSV format', ctx => {
    expect(ctx.stdout).to.not.contain('=== Cron To Go jobs in app')
    expect(ctx.stdout).to.contain('my-job-1,* * * * *,UTC,enabled,Hobby,my command 1')
    expect(ctx.stdout).to.contain('my-job-2,* * * * *,UTC,paused,Hobby,-')
    expect(ctx.stdout).to.contain('my-job-3,* * * * *,UTC,paused,-,my command 3')
  })

  testFactory()
  .stdout()
  .command(['cron:jobs', '--app', app, '--json'])
  .it('shows detailed information about Cron To Go jobs in JSON format', ctx => {
    expect(ctx.stdout).to.contain('"Alias": "my-job-1"')
    expect(ctx.stdout).to.contain('"State": "enabled"')
    expect(ctx.stdout).to.contain('"Alias": "my-job-2"')
    expect(ctx.stdout).to.contain('"State": "paused"')
  })

  test
  .nock('https://api.heroku.com', api => api
  .get(`/apps/${app}/config-vars`)
  .reply(200, configVarsStub),
  )
  .nock('https://api.crontogo.com', api => api
  .get(`/organizations/${organizationId}/jobs`)
  .reply(200, []),
  )
  .stdout()
  .command(['cron:jobs', '--app', app])
  .it('shows you have no jobs message', ctx => {
    expect(ctx.stdout).to.contain('You have no jobs.')
  })

  test
  .nock('https://api.heroku.com', api => api
  .get(`/apps/${app}/config-vars`)
  .reply(200, configVarsStub),
  )
  .nock('https://api.crontogo.com', api => api
  .get(`/organizations/${organizationId}/jobs`)
  .reply(500, {message: 'my-error'}),
  )
  .stderr()
  .command(['cron:jobs', '--app', app, '--json'])
  .catch(error => expect(error.message).to.match(/my-error/))
  .it('fails to show detailed information about Cron To Go jobs', ctx => {
    expect(ctx.stderr).to.equal('')
  })
})
