import {CliUx} from '@oclif/core'
import {flags} from '@heroku-cli/command'
import color from '@heroku-cli/color'

import formatDate from '../../lib/format-date'
import {fetchAuthInfo} from '../../lib/fetcher'
import BaseCommand from '../../lib/base'
import {Organization, OrganizationState} from '../../lib/schema'

export default class Cron extends BaseCommand {
  static description = 'get information about Cron To Go\nRead more about this feature at https://devcenter.heroku.com/articles/crontogo'

  static examples = [
    '$ heroku cron -a your-app',
    '$ heroku cron --app your-app --json',
  ]

  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
    json: flags.boolean({
      description: 'return the results as JSON',
    }),
  }

  async run(): Promise<void> {
    const {flags} = this.parse(Cron)

    const authInfo = await fetchAuthInfo(this.heroku, flags.app)

    this.api.auth = authInfo.apiKey

    const {body: organization} = await this.api.get<Organization>(
      `/organizations/${authInfo.organizationId}`,
      this.api.defaults,
    )

    if (flags.json) {
      CliUx.ux.styledJSON(organization)
      return
    }

    CliUx.ux.styledHeader(organization.Id)

    CliUx.ux.styledObject({
      Name: organization.Name,
      Region: organization.Region?.Name,
      JobsCount: organization.Plan?.JobsLimit ? `${organization.JobsCount}/${organization.Plan.JobsLimit}` : organization.JobsCount,
      State: organization.State === OrganizationState.ACTIVE ? color.green(organization.State) : color.gray(organization.State),
      Plan: organization.Plan?.Name,
      'Add-on': organization.Partner?.Addon?.name ? color.yellow(organization.Partner.Addon.name) : null,
      Created: formatDate(organization.CreatedAt),
      Updated: formatDate(organization.UpdatedAt),
    })
  }
}
