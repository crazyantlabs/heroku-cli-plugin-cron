import {expect, test} from '@oclif/test'
import * as _ from 'lodash'

const apiKey = '123456'
const app = 'myapp'
const organizationId = '123456'

const configVarsStub = {
  CRONTOGO_API_KEY: apiKey,
  CRONTOGO_ORGANIZATION_ID: organizationId,
}

const organizationStub = {
  Id: organizationId,
  Name: 'my-org',
  JobsCount: 2,
  Plan: {
    JobsLimit: 5,
  },
  Region: {
    Name: 'us-east-1',
  },
  Partner: {
    Addon: {
      name: 'my-addon',
    },
  },
  State: 'active',
  CreatedAt: '2020-01-01T12:00:00Z',
  UpdatedAt: '2020-01-01T12:00:00Z',
}
const noRegionOrganizationStub = _.merge({}, organizationStub, {Region: null})
const disabledOrganizationStub = _.merge({}, organizationStub, {State: 'disabled'})
const noPlanOrganizationStub = _.merge({}, organizationStub, {Plan: null})
const noPartnerOrganizationStub = _.merge({}, organizationStub, {Partner: null})
const noPartnerAddonOrganizationStub = _.merge({}, organizationStub, {Partner: {Addon: null}})

describe('cron', () => {
  test
  .nock('https://api.heroku.com', api => api
  .get(`/apps/${app}/config-vars`)
  .reply(200, configVarsStub),
  )
  .nock('https://api.crontogo.com', api => api
  .get(`/organizations/${organizationId}`)
  .reply(200, organizationStub),
  )
  .stdout()
  .command(['cron', '--app', app])
  .it('shows detailed information about Cron To Go', ctx => {
    expect(ctx.stdout).to.contain(`=== ${organizationId}`)
    expect(ctx.stdout).to.contain('Name:      my-org')
    expect(ctx.stdout).to.contain('Region:    us-east-1')
    expect(ctx.stdout).to.contain('State:     active')
    expect(ctx.stdout).to.contain('Add-on:    my-addon')
    expect(ctx.stdout).to.contain('JobsCount: 2/5')
    expect(ctx.stdout).to.contain('Created:   2020-01-01 12:00 UTC')
    expect(ctx.stdout).to.contain('Updated:   2020-01-01 12:00 UTC')
  })

  test
  .nock('https://api.heroku.com', api => api
  .get(`/apps/${app}/config-vars`)
  .reply(200, configVarsStub),
  )
  .nock('https://api.crontogo.com', api => api
  .get(`/organizations/${organizationId}`)
  .reply(200, disabledOrganizationStub),
  )
  .stdout()
  .command(['cron', '--app', app])
  .it('shows detailed information about Cron To Go when state is disabled', ctx => {
    expect(ctx.stdout).to.contain(`=== ${organizationId}`)
    expect(ctx.stdout).to.contain('State:     disabled')
  })

  test
  .nock('https://api.heroku.com', api => api
  .get(`/apps/${app}/config-vars`)
  .reply(200, configVarsStub),
  )
  .nock('https://api.crontogo.com', api => api
  .get(`/organizations/${organizationId}`)
  .reply(200, noPlanOrganizationStub),
  )
  .stdout()
  .command(['cron', '--app', app])
  .it('shows detailed information about Cron To Go when no plan is assigned', ctx => {
    expect(ctx.stdout).to.contain(`=== ${organizationId}`)
    expect(ctx.stdout).to.contain('JobsCount: 2')
  })

  test
  .nock('https://api.heroku.com', api => api
  .get(`/apps/${app}/config-vars`)
  .reply(200, configVarsStub),
  )
  .nock('https://api.crontogo.com', api => api
  .get(`/organizations/${organizationId}`)
  .reply(200, noRegionOrganizationStub),
  )
  .stdout()
  .command(['cron', '--app', app])
  .it('shows detailed information about Cron To Go when no region is assigned', ctx => {
    expect(ctx.stdout).to.contain(`=== ${organizationId}`)
    expect(ctx.stdout).to.not.contain('Region:')
  })

  test
  .nock('https://api.heroku.com', api => api
  .get(`/apps/${app}/config-vars`)
  .reply(200, configVarsStub),
  )
  .nock('https://api.crontogo.com', api => api
  .get(`/organizations/${organizationId}`)
  .reply(200, noPartnerOrganizationStub),
  )
  .stdout()
  .command(['cron', '--app', app])
  .it('shows detailed information about Cron To Go when no partner is assigned', ctx => {
    expect(ctx.stdout).to.contain(`=== ${organizationId}`)
    expect(ctx.stdout).to.not.contain('Add-on:')
  })

  test
  .nock('https://api.heroku.com', api => api
  .get(`/apps/${app}/config-vars`)
  .reply(200, configVarsStub),
  )
  .nock('https://api.crontogo.com', api => api
  .get(`/organizations/${organizationId}`)
  .reply(200, noPartnerAddonOrganizationStub),
  )
  .stdout()
  .command(['cron', '--app', app])
  .it('shows detailed information about Cron To Go when no partner add-on is assigned', ctx => {
    expect(ctx.stdout).to.contain(`=== ${organizationId}`)
    expect(ctx.stdout).to.not.contain('Add-on:')
  })

  test
  .nock('https://api.heroku.com', api => api
  .get(`/apps/${app}/config-vars`)
  .reply(200, configVarsStub),
  )
  .nock('https://api.crontogo.com', api => api
  .get(`/organizations/${organizationId}`)
  .reply(200, organizationStub),
  )
  .stdout()
  .command(['cron', '--app', app, '--json'])
  .it('shows detailed information about Cron To Go in JSON format', ctx => {
    expect(ctx.stdout).to.contain('"Name": "my-org"')
  })
})
