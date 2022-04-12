import * as HTTP from 'http-call'

export const deps = {
  // remote
  get HTTP(): typeof HTTP {
    return fetch('http-call')
  },
}

const cache: any = {}

function fetch(s: string) {
  if (!cache[s]) {
    /* eslint-disable-next-line unicorn/prefer-module */
    cache[s] = require(s)
  }

  return cache[s]
}

export default deps
