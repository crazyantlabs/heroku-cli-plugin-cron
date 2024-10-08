import * as moment from 'moment'

export default function (date: moment.MomentInput):string {
  return moment.utc(date).format('YYYY-MM-DD HH:mm UTC')
}
