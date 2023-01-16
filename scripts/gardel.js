// Description:
//   TODO
//
// Dependencies:
//   moment-business-days
//
// Configuration:
//   None
//
// Commands:
//   hubot gardel|cuando pagan|cuándo pagan - Indica la cantidad de dias que faltan para que paguen
//
// Author:
//   @hectorpalmatellez

const moment = require('moment-business-days')

module.exports = function gardel (robot) {
  'use strict'

  moment.locale('es')

  robot.respond(/gardel|cu[aá]ndo pagan(.*)/i, function (msg) {
    const today = moment(`${moment().format('YYYY-MM-DD')}T00:00:00-04:00`)
    const param = parseInt(msg.message.text.split(' ')[2], 10)
    const isItOver = moment(`${moment().format('YYYY-MM')}-${param}`) < today
    const paramDate = moment(`${moment().format('YYYY-MM')}-${param}`)
    const lastBusinessDayMoment = param ? isItOver ? paramDate.add(1, 'month') : paramDate : moment()
      .endOf('month')
      .isBusinessDay()
      ? moment().endOf('month')
      : moment()
        .endOf('month')
        .prevBusinessDay()
    const dateLastBusinessDay = lastBusinessDayMoment.format('YYYY-MM-DD')
    const lastBusinessDay = moment(`${dateLastBusinessDay}T00:00:00-04:00`)
    const dayMessage = moment.duration(lastBusinessDay.diff(today)).humanize()
    const dayCount = lastBusinessDay.diff(today, 'days')
    let message = ''
    const plural = dayCount > 1 ? 'n' : ''

    if (dayCount === 0) {
      message = ':tada: Hoy pagan :tada:'
    } else if (dayCount < 0) {
      message = `Pagaron hace ${dayMessage}. Este mes el pago fue el ${lastBusinessDay.format(
        'D'
      )}, el pasado ${lastBusinessDay.format('dddd')}`
    } else {
      message = `Falta${plural} ${dayMessage} para que paguen. Este mes pagan el ${lastBusinessDay.format(
        'D'
      )}, que cae ${lastBusinessDay.format('dddd')} :tired_face:`
    }
    return msg.send(message)
  })
}
