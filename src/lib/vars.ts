export class Vars {
  get host(): string {
    return this.envHost || 'crontogo.com'
  }

  get configVarsPrefix(): string {
    return this.envConfigVarsPrefix || 'CRONTOGO'
  }

  get apiUrl(): string {
    return this.host.startsWith('http') ? this.host : `https://api.${this.host}`
  }

  get apiHost(): string {
    if (this.host.startsWith('http')) {
      const u = new URL(this.host)
      if (u.host) return u.host
    }

    return `api.${this.host}`
  }

  get envHost(): string | undefined {
    return process.env.CRONTOGO_HOST
  }

  get envConfigVarsPrefix(): string | undefined {
    return process.env.CRONTOGO_CONFIG_VARS_PREFIX
  }
}

export const vars = new Vars()
