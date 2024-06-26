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
    Size: 'Basic',
    TimeToLive: 30,
  },
  LastAttempt: {
    Id: 'attempt-123456',
    State: 'running',
    CreatedAt: '2020-01-01T12:00:00Z',
  },
  Jitter: 5,
  CreatedAt: '2020-01-01T12:00:00Z',
  UpdatedAt: '2020-01-01T12:00:00Z',
}

const updateNicknameJobStub = _.merge({}, jobStub, {Alias: 'updated-job'})
const updateTimezoneJobStub = _.merge({}, jobStub, {Timezone: 'GMT'})
const updateCommandJobStub = _.merge({}, jobStub, {Target: {Command: 'updated-command'}})
const updateDynoJobStub = _.merge({}, jobStub, {Target: {Size: 'Standard-1X'}})
const updateTimeoutJobStub = _.merge({}, jobStub, {Target: {TimeToLive: 700}})
const updateStateJobStub = _.merge({}, jobStub, {State: 'paused'})
const multiUpdateJobStub = _.merge({}, jobStub, {Alias: 'multi-updates', State: 'paused'})
const updateRateJobStub = _.merge({}, jobStub, {ScheduleExpression: '3 hours'})

const invalidScheduleExpression = '* *'

describe('cron:jobs:update', () => {
  const testFactory = stub => {
    return test
    .nock('https://api.heroku.com', api => api
    .get(`/apps/${app}/config-vars`)
    .reply(200, configVarsStub),
    )
    .nock('https://api.crontogo.com', api => api
    .patch(`/organizations/${organizationId}/jobs/${jobId}`)
    .reply(200, stub),
    )
  }

  testFactory(jobStub)
  .stderr()
  .stdout()
  .command(['cron:jobs:update', jobId, '--app', app])
  .it('updates given job successfully', ctx => {
    expect(ctx.stderr).to.contain(`Updating job ${jobId}... done`)
    expect(ctx.stdout).to.contain(`Successfully updated job ${jobId}`)
  })

  testFactory(jobStub)
  .stdout()
  .command(['cron:jobs:update', jobId, '--app', app, '--json'])
  .it('shows detailed information about Cron To Go job with no updates in JSON format', ctx => {
    expect(ctx.stdout).to.contain('"Alias": "my-job"')
    expect(ctx.stdout).to.contain('"State": "enabled"')
  })

  testFactory(updateNicknameJobStub)
  .stdout()
  .command(['cron:jobs:update', jobId, '--app', app, '--nickname', updateNicknameJobStub.Alias, '--json'])
  .it('shows detailed information about Cron To Go job with alias update in JSON format', ctx => {
    expect(ctx.stdout).to.contain('"Alias": "updated-job"')
    expect(ctx.stdout).to.contain('"State": "enabled"')
  })

  testFactory(updateStateJobStub)
  .stdout()
  .command(['cron:jobs:update', jobId, '--app', app, '--state', updateStateJobStub.State, '--json'])
  .it('shows detailed information about Cron To Go job with state update in JSON format', ctx => {
    expect(ctx.stdout).to.contain('"Alias": "my-job"')
    expect(ctx.stdout).to.contain('"State": "paused"')
  })

  testFactory(updateTimezoneJobStub)
  .stdout()
  .command(['cron:jobs:update', jobId, '--app', app, '--timezone', updateTimezoneJobStub.Timezone, '--json'])
  .it('shows detailed information about Cron To Go job with timezone update in JSON format', ctx => {
    expect(ctx.stdout).to.contain('"Alias": "my-job"')
    expect(ctx.stdout).to.contain('"Timezone": "GMT"')
  })

  testFactory(updateCommandJobStub)
  .stdout()
  .command(['cron:jobs:update', jobId, '--app', app, '--command', updateCommandJobStub.Target.Command, '--json'])
  .it('shows detailed information about Cron To Go job with command update in JSON format', ctx => {
    expect(ctx.stdout).to.contain('"Alias": "my-job"')
    expect(ctx.stdout).to.contain('"Command": "updated-command"')
  })

  testFactory(updateDynoJobStub)
  .stdout()
  .command(['cron:jobs:update', jobId, '--app', app, '--dyno', updateDynoJobStub.Target.Size, '--json'])
  .it('shows detailed information about Cron To Go job with dyno size update in JSON format', ctx => {
    expect(ctx.stdout).to.contain('"Alias": "my-job"')
    expect(ctx.stdout).to.contain('"Size": "Standard-1X"')
  })
  testFactory(updateTimeoutJobStub)
  .stdout()
  .command(['cron:jobs:update', jobId, '--app', app, '--timeout', '700', '--json'])
  .it('shows detailed information about Cron To Go job with timeout update in JSON format', ctx => {
    expect(ctx.stdout).to.contain('"Alias": "my-job"')
    expect(ctx.stdout).to.contain('"TimeToLive": 700')
  })

  testFactory(multiUpdateJobStub)
  .stdout()
  .command(['cron:jobs:update', jobId, '--app', app, '--nickname', multiUpdateJobStub.Alias, '--state', multiUpdateJobStub.State, '--json'])
  .it('shows detailed information about Cron To Go job with nickname and state updates in JSON format', ctx => {
    expect(ctx.stdout).to.contain('"Alias": "multi-updates"')
    expect(ctx.stdout).to.contain('"State": "paused"')
  })

  testFactory(updateRateJobStub)
  .stdout()
  .command(['cron:jobs:update', jobId, '--app', app, '--nickname', updateRateJobStub.Alias, '--state', multiUpdateJobStub.State])
  .it('shows detailed information about Cron To Go job with schedule expression updates', ctx => {
    expect(ctx.stdout).to.contain(`Successfully updated job ${jobId}`)
  })

  test
  .nock('https://api.heroku.com', api => api
  .get(`/apps/${app}/config-vars`)
  .reply(200, configVarsStub),
  )
  .stderr()
  .command(['cron:jobs:update', jobId, '--app', app, '--schedule', invalidScheduleExpression])
  .catch(error => expect(error.message).to.match(/Unfortunately, schedule expression doesn't seem to be valid./))
  .it('fails to update given job when validation fails', ctx => {
    expect(ctx.stderr).to.equal('')
  })

  test
  .nock('https://api.heroku.com', api => api
  .get(`/apps/${app}/config-vars`)
  .reply(200, configVarsStub),
  )
  .nock('https://api.crontogo.com', api => api
  .patch(`/organizations/${organizationId}/jobs/${jobId}`)
  .reply(500, {message: 'my-error'}),
  )
  .stderr()
  .command(['cron:jobs:update', jobId, '--app', app])
  .catch(error => expect(error.message).to.match(/my-error/))
  .it('fails to update given job when API error is thrown', ctx => {
    expect(ctx.stderr).to.contain(`Updating job ${jobId}... failed!`)
  })
})
