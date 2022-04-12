/* eslint-disable-next-line unicorn/prefer-node-protocol */
import * as stream from 'stream'

// this splits a stream into lines
const transform = new stream.Transform({decodeStrings: false})

transform._transform = function (chunk, _encoding, next) {
  let data = chunk
  if (this._lastLineData) data = this._lastLineData + data

  const lines = data.split('\n')
  this._lastLineData = lines.splice(-1, 1)[0]

  for (const line of lines) {
    this.push.bind(this)(line)
  }

  next()
}

transform._flush = function (done) {
  if (this._lastLineData) this.push(this._lastLineData)
  this._lastLineData = null
  done()
}

export default transform
