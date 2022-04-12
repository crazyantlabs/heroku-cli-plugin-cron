import {expect, test} from '@oclif/test'
import * as _ from 'lodash'

const apiKey = '123456'
const app = 'myapp'
const organizationId = '123456'
const jobId = 'job-123456'

const configVarsStub = {
  CRONTOGO_API_KEY: apiKey,
  CRONTOGO_ORGANIZATION_ID: organizationId,
}

const jobStub = {
  Id: jobId,
  Alias: 'my-job',
  State: 'enabled',
  Timezone: 'UTC',
  ScheduleExpression: '* * * * *',
  Target: {
    Command: 'my command',
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
}

const pausedJobStub = _.merge({}, jobStub, {State: 'paused'})
const jobStubNoTarget = _.omit(jobStub, 'Target')
const jobStubNoTargetCommand = _.omit(jobStub, 'Target.Command')
const jobStubNoLastAttempt = _.omit(jobStub, 'LastAttempt')

describe('cron:jobs:info', () => {
  const testLastAttemptFactory = (attemptState, stub) => {
    return test
    .nock('https://api.heroku.com', api => api
    .get(`/apps/${app}/config-vars`)
    .reply(200, configVarsStub),
    )
    .stub(stub, 'LastAttempt.State', attemptState)
    .nock('https://api.crontogo.com', api => api
    .get(`/organizations/${organizationId}/jobs/${jobId}`)
    .reply(200, stub),
    )
  }

  testLastAttemptFactory('running', jobStub)
  .stdout()
  .command(['cron:jobs:info', jobId, '--app', app])
  .it('shows detailed information about a job on Cron To Go', ctx => {
    expect(ctx.stdout).to.contain(`=== Job info for ${jobId}`)
    expect(ctx.stdout).to.contain('Nickname: my-job')
    expect(ctx.stdout).to.contain('State:    enabled')
    expect(ctx.stdout).to.contain('Schedule: * * * * *')
    expect(ctx.stdout).to.contain('Timezone: UTC')
    expect(ctx.stdout).to.contain('Created:  2020-01-01 12:00 UTC')
    expect(ctx.stdout).to.contain('Updated:  2020-01-01 12:00 UTC')
    expect(ctx.stdout).to.contain('=== Target')
    expect(ctx.stdout).to.contain('Command: my command')
    expect(ctx.stdout).to.contain('Dyno:    Hobby')
    expect(ctx.stdout).to.contain('Timeout: 30')
    expect(ctx.stdout).to.contain('=== Last run')
    expect(ctx.stdout).to.contain('Id:     attempt-123456')
    expect(ctx.stdout).to.contain('Status: running')
    expect(ctx.stdout).to.contain('Date:   2020-01-01 12:00 UTC')
  })

  testLastAttemptFactory('running', pausedJobStub)
  .stdout()
  .command(['cron:jobs:info', jobId, '--app', app])
  .it('shows detailed information about a paused job on Cron To Go', ctx => {
    expect(ctx.stdout).to.contain('State:    paused')
  })

  testLastAttemptFactory('running', jobStubNoTarget)
  .stdout()
  .command(['cron:jobs:info', jobId, '--app', app])
  .it('shows detailed information about a job on Cron To Go without target', ctx => {
    expect(ctx.stdout).to.contain(`=== Job info for ${jobId}`)
    expect(ctx.stdout).to.not.contain('=== Target')
    expect(ctx.stdout).to.not.contain('Command: my command')
    expect(ctx.stdout).to.not.contain('Dyno:    Hobby')
    expect(ctx.stdout).to.not.contain('Timeout: 30')
    expect(ctx.stdout).to.contain('=== Last run')
  })

  testLastAttemptFactory('running', jobStub)
  .stdout()
  .command(['cron:jobs:info', jobId, '--app', app, '--json'])
  .it('shows detailed information about Cron To Go job in JSON format', ctx => {
    expect(ctx.stdout).to.contain('"Alias": "my-job"')
    expect(ctx.stdout).to.contain('"State": "enabled"')
  })

  testLastAttemptFactory('failed', jobStub)
  .stdout()
  .command(['cron:jobs:info', jobId, '--app', app])
  .it('shows failed as last attempt status', ctx => {
    expect(ctx.stdout).to.contain('Status: failed')
  })

  testLastAttemptFactory('succeeded', jobStub)
  .stdout()
  .command(['cron:jobs:info', jobId, '--app', app])
  .it('shows succeeded as last attempt status', ctx => {
    expect(ctx.stdout).to.contain('Status: succeeded')
  })

  testLastAttemptFactory('succeeded', jobStubNoTargetCommand)
  .stdout()
  .command(['cron:jobs:info', jobId, '--app', app])
  .it('shows dash as command when command is empty', ctx => {
    expect(ctx.stdout).to.contain('Command: -')
  })

  test
  .nock('https://api.heroku.com', api => api
  .get(`/apps/${app}/config-vars`)
  .reply(200, configVarsStub),
  )
  .nock('https://api.crontogo.com', api => api
  .get(`/organizations/${organizationId}/jobs/${jobId}`)
  .reply(200, jobStubNoLastAttempt),
  )
  .stdout()
  .command(['cron:jobs:info', jobId, '--app', app])
  .it('shows detailed information about a job on Cron To Go without last run', ctx => {
    expect(ctx.stdout).to.contain(`=== Job info for ${jobId}`)
    expect(ctx.stdout).to.contain('=== Target')
    expect(ctx.stdout).to.not.contain('=== Last run')
    expect(ctx.stdout).to.not.contain('Id:     attempt-123456')
    expect(ctx.stdout).to.not.contain('Status: running')
    expect(ctx.stdout).to.not.contain('Date:   2020-01-01 12:00 UTC')
  })

  test
  .nock('https://api.heroku.com', api => api
  .get(`/apps/${app}/config-vars`)
  .reply(200, configVarsStub),
  )
  .nock('https://api.crontogo.com', api => api
  .get(`/organizations/${organizationId}/jobs/${jobId}`)
  .reply(500, {message: 'my-error'}),
  )
  .stderr()
  .command(['cron:jobs:info', jobId, '--app', app, '--json'])
  .catch(error => expect(error.message).to.match(/my-error/))
  .it('fails to show detailed information about Cron To Go job', ctx => {
    expect(ctx.stderr).to.equal('')
  })
})
