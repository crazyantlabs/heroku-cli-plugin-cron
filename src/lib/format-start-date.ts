import * as moment from 'moment'

export default function (date: moment.MomentInput):string {
  if (!date) {
    return null
  }

  return moment.utc(date).toISOString()
}
