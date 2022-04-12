import * as Heroku from '@heroku-cli/schema'
import {APIClient} from '@heroku-cli/command'
import {CliUx} from '@oclif/core'

import {AuthInfo} from './schema'
import {vars} from './vars'

export async function fetchAuthInfo(heroku: APIClient, app: string): Promise<AuthInfo> {
  const {body: config} = await heroku.get<Heroku.ConfigVars>(`/apps/${app}/config-vars`)

  const organizationId  = config[`${vars.configVarsPrefix}_ORGANIZATION_ID`]
  const apiKey          = config[`${vars.configVarsPrefix}_API_KEY`]

  if (!apiKey) {
    CliUx.ux.error(
      'config var CRONTOGO_API_KEY not set. The Cron To Go add-on is required to use this plugin. Read more about this feature at https://devcenter.heroku.com/articles/crontogo',
    )
    // eslint-disable-next-line unicorn/no-process-exit, no-process-exit
    process.exit(1)
  }

  if (!organizationId) {
    CliUx.ux.error(
      'config var CRONTOGO_ORGANIZATION_ID not set. The Cron To Go add-on is required to use this plugin. Read more about this feature at https://devcenter.heroku.com/articles/crontogo',
    )
    // eslint-disable-next-line unicorn/no-process-exit, no-process-exit
    process.exit(1)
  }

  return {
    organizationId,
    apiKey,
  }
}
