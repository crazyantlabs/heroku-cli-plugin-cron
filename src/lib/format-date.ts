import * as moment from 'moment'

export default function (date: number):string {
  return moment.utc(date).format('YYYY-MM-DD HH:mm UTC')
}
