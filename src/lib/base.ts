import {Command} from '@heroku-cli/command'
import {IConfig} from '@oclif/config'
import {CliUx} from '@oclif/core'
import color from '@heroku-cli/color'
import {APIClient} from './api-client'

export default abstract class Base extends Command {
  api: APIClient;

  constructor(argv: Array<string>, config: IConfig) {
    super(argv, config)

    const client = new APIClient(this.config, {})
    this.api = client
  }
}

export async function confirmResource(resource: string, confirm: string): Promise<boolean> {
  if (!confirm) {
    confirm = await CliUx.ux.prompt(`To proceed, type ${color.bold.red(resource)} or re-run this command with ${color.bold.red('--confirm', resource)}`)
  }

  if (confirm !== resource) {
    CliUx.ux.error(`Confirmation ${color.bold.red(confirm)} did not match ${color.bold.red(resource)}. Aborted.`)
  }

  return true
}
