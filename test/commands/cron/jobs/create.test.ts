import {expect, test} from '@oclif/test'
import * as inquirer from 'inquirer'
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
  Retries: 3,
  Jitter: 0,
  CreatedAt: '2020-01-01T12:00:00Z',
  UpdatedAt: '2020-01-01T12:00:00Z',
}

const createNicknameJobStub = _.merge({}, jobStub, {Alias: 'created-job'})
const createLongNicknameJobStub = _.merge({}, jobStub, {Alias: 'created-job-with-very-long-name'})
const createTimezoneJobStub = _.merge({}, jobStub, {Timezone: 'GMT'})
const createCommandJobStub = _.merge({}, jobStub, {Target: {Command: 'created-command'}})
const createDynoJobStub = _.merge({}, jobStub, {Target: {Size: 'Standard-1X'}})
const createTimeoutJobStub = _.merge({}, jobStub, {Target: {TimeToLive: 700}})
const createRetriesJobStub = _.merge({}, jobStub, {Retries: 5})
const createJitterJobStub = _.merge({}, jobStub, {Jitter: 5})
const createStateJobStub = _.merge({}, jobStub, {State: 'paused'})
const multiUpdateJobStub = _.merge({}, jobStub, {Alias: 'multi-creates', State: 'paused'})
const createRateJobStub = _.merge({}, jobStub, {ScheduleExpression: '3 hours'})

describe('cron:jobs:create', () => {
  const testFactory = stub => {
    return test
    .nock('https://api.heroku.com', api => api
    .get(`/apps/${app}/config-vars`)
    .reply(200, configVarsStub),
    )
    .nock('https://api.crontogo.com', api => api
    .post(`/organizations/${organizationId}/jobs`)
    .reply(200, stub),
    )
    .stderr()
    .stdout()
    .stub(inquirer, 'prompt', () => {
      return Promise.resolve({
        nickname: stub.Alias,
        schedule: stub.ScheduleExpression,
        timezone: stub.Timezone,
        dyno: stub.Target?.Size,
        command: stub.Target?.Command,
        timeout: stub.Target?.TimeToLive,
        retries: stub.Retries,
        state: stub.State,
      })
    })
  }

  testFactory(jobStub)
  .command(['cron:jobs:create', '--app', app])
  .it('creates job successfully when all questions are answered', ctx => {
    expect(ctx.stderr).to.contain(`Creating job ${jobStub.Alias}... done`)
    expect(ctx.stdout).to.contain(`Successfully created job ${jobId}`)
  })

  testFactory(createLongNicknameJobStub)
  .stderr()
  .stdout()
  .command(['cron:jobs:create', '--app', app])
  .it('creates job successfully and shows the correct job alias when alias is greater than 16 characters', ctx => {
    expect(ctx.stderr).to.contain('Creating job created-job-with...... done')
    expect(ctx.stdout).to.contain(`Successfully created job ${jobId}`)
  })

  testFactory(jobStub)
  .stderr()
  .stdout()
  .command(['cron:jobs:create', '--app', app, '--json'])
  .it('shows detailed information about newly created Cron To Go job in JSON format', ctx => {
    expect(ctx.stderr).to.contain(`Creating job ${jobStub.Alias}... done`)
    expect(ctx.stdout).to.contain('"Alias": "my-job"')
    expect(ctx.stdout).to.contain('"State": "enabled"')
  })

  testFactory(createNicknameJobStub)
  .stdout()
  .command(['cron:jobs:create', '--app', app, '--nickname', createNicknameJobStub.Alias, '--json'])
  .it('shows detailed information about newly created Cron To Go job with alias in JSON format', ctx => {
    expect(ctx.stdout).to.contain('"Alias": "created-job"')
    expect(ctx.stdout).to.contain('"State": "enabled"')
  })

  testFactory(createStateJobStub)
  .stdout()
  .command(['cron:jobs:create', '--app', app, '--state', createStateJobStub.State, '--json'])
  .it('shows detailed information about newly created Cron To Go job with state in JSON format', ctx => {
    expect(ctx.stdout).to.contain('"Alias": "my-job"')
    expect(ctx.stdout).to.contain('"State": "paused"')
  })

  testFactory(createTimezoneJobStub)
  .stdout()
  .command(['cron:jobs:create', '--app', app, '--timezone', createTimezoneJobStub.Timezone, '--json'])
  .it('shows detailed information about newly created Cron To Go job with timezone in JSON format', ctx => {
    expect(ctx.stdout).to.contain('"Alias": "my-job"')
    expect(ctx.stdout).to.contain('"Timezone": "GMT"')
  })

  testFactory(createCommandJobStub)
  .stdout()
  .command(['cron:jobs:create', '--app', app, '--command', createCommandJobStub.Target.Command, '--json'])
  .it('shows detailed information about newly created Cron To Go job with command in JSON format', ctx => {
    expect(ctx.stdout).to.contain('"Alias": "my-job"')
    expect(ctx.stdout).to.contain('"Command": "created-command"')
  })

  testFactory(createDynoJobStub)
  .stdout()
  .command(['cron:jobs:create', '--app', app, '--dyno', createDynoJobStub.Target.Size, '--json'])
  .it('shows detailed information about newly created Cron To Go job with dyno size in JSON format', ctx => {
    expect(ctx.stdout).to.contain('"Alias": "my-job"')
    expect(ctx.stdout).to.contain('"Size": "Standard-1X"')
  })

  testFactory(createTimeoutJobStub)
  .stdout()
  .command(['cron:jobs:create', '--app', app, '--timeout', '700', '--json'])
  .it('shows detailed information about newly created Cron To Go job with timeout in JSON format', ctx => {
    expect(ctx.stdout).to.contain('"Alias": "my-job"')
    expect(ctx.stdout).to.contain('"TimeToLive": 700')
  })

  testFactory(createRetriesJobStub)
  .stdout()
  .command(['cron:jobs:create', '--app', app, '--retries', '5', '--json'])
  .it('shows detailed information about newly created Cron To Go job with retries in JSON format', ctx => {
    expect(ctx.stdout).to.contain('"Alias": "my-job"')
    expect(ctx.stdout).to.contain('"Retries": 5')
  })

  testFactory(createJitterJobStub)
  .stdout()
  .command(['cron:jobs:create', '--app', app, '--jitter', '5', '--json'])
  .it('shows detailed information about newly created Cron To Go job with jitter in JSON format', ctx => {
    expect(ctx.stdout).to.contain('"Alias": "my-job"')
    expect(ctx.stdout).to.contain('"Jitter": 5')
  })

  testFactory(multiUpdateJobStub)
  .stdout()
  .command(['cron:jobs:create', '--app', app, '--nickname', multiUpdateJobStub.Alias, '--state', multiUpdateJobStub.State, '--json'])
  .it('shows detailed information about newly created Cron To Go job with alias and state in JSON format', ctx => {
    expect(ctx.stdout).to.contain('"Alias": "multi-creates"')
    expect(ctx.stdout).to.contain('"State": "paused"')
  })

  testFactory(createRateJobStub)
  .stdout()
  .command(['cron:jobs:create', '--app', app, '--nickname', createRateJobStub.Alias, '--state', createRateJobStub.State, '--json'])
  .it('shows detailed information about newly created Cron To Go job with alias and state in JSON format', ctx => {
    expect(ctx.stdout).to.contain('"ScheduleExpression": "3 hours"')
  })

  test
  .nock('https://api.heroku.com', api => api
  .get(`/apps/${app}/config-vars`)
  .reply(200, configVarsStub),
  )
  .stderr()
  .stub(inquirer, 'prompt', () => {
    return Promise.resolve({
      nickname: jobStub.Alias,
      timezone: jobStub.Timezone,
      dyno: jobStub.Target?.Size,
      schedule: 'invalid expression',
      command: jobStub.Target?.Command,
      timeout: jobStub.Target?.TimeToLive,
      retries: jobStub.Retries,
      jitter: jobStub.Jitter,
      state: jobStub.State,
    })
  })
  .command(['cron:jobs:create', '--app', app, '--schedule', '"invalid expression"'])
  .catch(error => expect(error.message).to.match(/Unfortunately, schedule expression doesn't seem to be valid./))
  .it('fails to create job with invalid schedule expression', ctx => {
    expect(ctx.stderr).to.equal('')
  })

  test
  .nock('https://api.heroku.com', api => api
  .get(`/apps/${app}/config-vars`)
  .reply(200, configVarsStub),
  )
  .nock('https://api.crontogo.com', api => api
  .post(`/organizations/${organizationId}/jobs`)
  .reply(500, {message: 'my-error'}),
  )
  .stderr()
  .stub(inquirer, 'prompt', () => {
    return Promise.resolve({
      nickname: jobStub.Alias,
      schedule: jobStub.ScheduleExpression,
      timezone: jobStub.Timezone,
      dyno: jobStub.Target?.Size,
      command: jobStub.Target?.Command,
      timeout: jobStub.Target?.TimeToLive,
      retries: jobStub.Retries,
      jitter: jobStub.Jitter,
      state: jobStub.State,
    })
  })
  .command(['cron:jobs:create', '--app', app])
  .catch(error => expect(error.message).to.match(/my-error/))
  .it('fails to create job when API error is thrown', ctx => {
    expect(ctx.stderr).to.contain(`Creating job ${jobStub.Alias}... failed!`)
  })
})
