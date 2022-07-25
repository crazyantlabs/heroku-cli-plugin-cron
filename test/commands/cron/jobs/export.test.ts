import {expect, test} from '@oclif/test'
/* eslint-disable-next-line */
import * as path from 'path'

const apiKey = '123456'
const app = 'myapp'
const organizationId = '123456'

/* eslint-disable-next-line unicorn/prefer-module */
const filename = path.resolve(__dirname, '../../../manifests/test.export.manifest.yaml')
/* eslint-disable-next-line unicorn/prefer-module */
const noJobsFilename = path.resolve(__dirname, '../../../manifests/test.export.no-jobs.manifest.yaml')

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

describe('cron:jobs:export', () => {
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

  const noJobsFactory = () => {
    return test
    .nock('https://api.heroku.com', api => api
    .get(`/apps/${app}/config-vars`)
    .reply(200, configVarsStub),
    )
    .nock('https://api.crontogo.com', api => api
    .get(`/organizations/${organizationId}/jobs`)
    .reply(200, []),
    )
  }

  testFactory()
  .stderr()
  .stdout()
  .command(['cron:jobs:export', filename, '--app', app])
  .it('exports jobs to given manifest file successfully', ctx => {
    expect(ctx.stderr).to.contain(`Writing ${filename} manifest file for ${organizationId} Cron To Go organization jobs... done`)
  })

  noJobsFactory()
  .stderr()
  .stdout()
  .command(['cron:jobs:export', noJobsFilename, '--app', app])
  .it('shows no jobs to export message', ctx => {
    expect(ctx.stderr).to.contain(`Writing ${noJobsFilename} manifest file for ${organizationId} Cron To Go organization jobs... done`)
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
  .command(['cron:jobs:export', 'some-file.yaml', '--app', app])
  .catch(error => expect(error.message).to.match(/my-error/))
  .it('fails to show detailed information about Cron To Go jobs', ctx => {
    expect(ctx.stderr).to.equal('')
  })
})
