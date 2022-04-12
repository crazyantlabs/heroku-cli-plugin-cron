import {expect, test} from '@oclif/test'
/* eslint-disable-next-line */
import * as path from 'path'

const apiKey = '123456'
const app = 'myapp'
const organizationId = '123456'
const jobId = 'job-123456'
const job2Id = 'job2-123456'
/* eslint-disable-next-line unicorn/prefer-module */
const filename = path.resolve(__dirname, '../../../manifests/test.import.manifest.yaml')
/* eslint-disable-next-line unicorn/prefer-module */
const noJobsFilename = path.resolve(__dirname, '../../../manifests/test.import.no-jobs.manifest.yaml')
/* eslint-disable-next-line unicorn/prefer-module */
const invalidJobsFilename = path.resolve(__dirname, '../../../manifests/test.import.invalid-jobs.manifest.yaml')

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

const job2Stub = {
  Id: job2Id,
  Alias: 'my-job-2',
  State: 'enabled',
  Timezone: 'UTC',
  ScheduleExpression: '* * * * *',
  Target: {
    Command: 'my command 2',
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

describe('cron:jobs:import', () => {
  const testFactory = () => {
    return test
    .nock('https://api.heroku.com', api => api
    .get(`/apps/${app}/config-vars`)
    .reply(200, configVarsStub),
    )
    .nock('https://api.crontogo.com', api => api
    .post(`/organizations/${organizationId}/jobs`)
    .reply(200, jobStub),
    )
    .nock('https://api.crontogo.com', api => api
    .post(`/organizations/${organizationId}/jobs`)
    .reply(200, job2Stub),
    )
  }

  const testInvalidFactory = () => {
    return test
    .nock('https://api.heroku.com', api => api
    .get(`/apps/${app}/config-vars`)
    .reply(200, configVarsStub),
    )
    .nock('https://api.crontogo.com', api => api
    .post(`/organizations/${organizationId}/jobs`)
    .reply(200, jobStub),
    )
  }

  const testWithDeleteFactory = () => {
    return test
    .nock('https://api.heroku.com', api => api
    .get(`/apps/${app}/config-vars`)
    .reply(200, configVarsStub),
    )
    .nock('https://api.crontogo.com', api => api
    .get(`/organizations/${organizationId}/jobs`)
    .reply(200, [jobStub, job2Stub]),
    )
    .nock('https://api.crontogo.com', api => api
    .delete(`/organizations/${organizationId}/jobs/${jobId}`)
    .reply(200),
    )
    .nock('https://api.crontogo.com', api => api
    .delete(`/organizations/${organizationId}/jobs/${job2Id}`)
    .reply(200),
    )
    .nock('https://api.crontogo.com', api => api
    .post(`/organizations/${organizationId}/jobs`)
    .reply(200, jobStub),
    )
    .nock('https://api.crontogo.com', api => api
    .post(`/organizations/${organizationId}/jobs`)
    .reply(200, job2Stub),
    )
  }

  const testWithFailingDeleteFactory = () => {
    return test
    .nock('https://api.heroku.com', api => api
    .get(`/apps/${app}/config-vars`)
    .reply(200, configVarsStub),
    )
    .nock('https://api.crontogo.com', api => api
    .get(`/organizations/${organizationId}/jobs`)
    .reply(200, [jobStub, job2Stub]),
    )
    .nock('https://api.crontogo.com', api => api
    .delete(`/organizations/${organizationId}/jobs/${jobId}`)
    .reply(200),
    )
    .nock('https://api.crontogo.com', api => api
    .delete(`/organizations/${organizationId}/jobs/${job2Id}`)
    .reply(500, {message: 'my-error'}),
    )
  }

  testFactory()
  .stderr()
  .stdout()
  .command(['cron:jobs:import', filename, '--app', app])
  .it('imports given manifest successfully and creates requested jobs', ctx => {
    expect(ctx.stderr).to.contain(`Reading ${filename} manifest file to import to ${organizationId} Cron To Go organization... done`)
    expect(ctx.stderr).to.contain(`Importing jobs to ${organizationId} Cron To Go organization... done. 2/2 jobs imported`)
  })

  testInvalidFactory()
  .stderr()
  .stdout()
  .command(['cron:jobs:import', invalidJobsFilename, '--app', app])
  .catch(error => expect(error.message).to.match(/Unfortunately, schedule expression doesn't seem to be valid/))
  .it('imports 1 out of 3 manifest jobs successfully', ctx => {
    expect(ctx.stderr).to.contain(`Reading ${invalidJobsFilename} manifest file to import to ${organizationId} Cron To Go organization... done`)
    expect(ctx.stderr).to.contain(`Importing jobs to ${organizationId} Cron To Go organization... failed! 0/3 jobs imported`)
  })

  test
  .nock('https://api.heroku.com', api => api
  .get(`/apps/${app}/config-vars`)
  .reply(200, configVarsStub),
  )
  .stderr()
  .stdout()
  .command(['cron:jobs:import', noJobsFilename, '--app', app])
  .it('shows no jobs to import message', ctx => {
    expect(ctx.stderr).to.contain(`Reading ${noJobsFilename} manifest file to import to ${organizationId} Cron To Go organization... done`)
    expect(ctx.stderr).to.contain(`Importing jobs to ${organizationId} Cron To Go organization... no jobs to import`)
  })

  testWithDeleteFactory()
  .stderr()
  .stdout()
  .command(['cron:jobs:import', filename, '--app', app, '--delete', '--confirm', app])
  .it('imports given manifest successfully, deletes all jobs and creates requested jobs', ctx => {
    expect(ctx.stderr).to.contain(`Reading ${filename} manifest file to import to ${organizationId} Cron To Go organization... done`)
    expect(ctx.stderr).to.contain(`Deleting all jobs from ${organizationId} Cron To Go organization... done. 2/2 jobs deleted`)
    expect(ctx.stderr).to.contain(`Importing jobs to ${organizationId} Cron To Go organization... done. 2/2 jobs imported`)
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
  .stderr()
  .stdout()
  .command(['cron:jobs:import', noJobsFilename, '--app', app, '--delete', '--confirm', app])
  .it('shows no jobs to delete and no jobs to import messages', ctx => {
    expect(ctx.stderr).to.contain(`Reading ${noJobsFilename} manifest file to import to ${organizationId} Cron To Go organization... done`)
    expect(ctx.stderr).to.contain(`Deleting all jobs from ${organizationId} Cron To Go organization... no jobs to delete`)
    expect(ctx.stderr).to.contain(`Importing jobs to ${organizationId} Cron To Go organization... no jobs to import`)
  })

  testWithFailingDeleteFactory()
  .stderr()
  .stdout()
  .command(['cron:jobs:import', filename, '--app', app, '--delete', '--confirm', app])
  .catch(error => expect(error.message).to.match(/my-error/))
  .it('imports given manifest successfully, deletes 1 out of 2 jobs and does not import requested jobs', ctx => {
    expect(ctx.stderr).to.contain(`Reading ${filename} manifest file to import to ${organizationId} Cron To Go organization... done`)
    expect(ctx.stderr).to.contain(`Deleting all jobs from ${organizationId} Cron To Go organization... failed! 1/2 jobs deleted`)
  })

  test
  .stdout()
  .stderr()
  .command(['cron:jobs:import', filename, '--app', app, '--delete', '--confirm', 'wrong-confirm'])
  .catch(error => expect(error.message).to.match(/Confirmation .* did not match .*/))
  .it('fails to delete all jobs before import due to invalid confirmation', ctx => {
    expect(ctx.stderr).to.equal('')
  })

  test
  .nock('https://api.heroku.com', api => api
  .get(`/apps/${app}/config-vars`)
  .reply(200, configVarsStub),
  )
  .stderr()
  .command(['cron:jobs:import', 'no-manufest-file.yml', '--app', app])
  .catch(error => expect(error.message).to.match(/no such file or directory/))
  .it('fails to read manifest file', ctx => {
    expect(ctx.stderr).to.contain(`Reading no-manufest-file.yml manifest file to import to ${organizationId} Cron To Go organization... failed!`)
  })
})
