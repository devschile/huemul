// Description:
//   Return pay day in current month
//
// Dependencies:
//   moment-business-days
//
// Configuration:
//   None
//
// Commands:
//   hubot gardel|cu[á|a]ndo pagan - Indica la cantidad de dias que faltan para que paguen
//   hubot gardel|cu[á|a]ndo pagan <param> - Indica cuántos días faltan para la fecha de pago elegida
//
// Author:
//   @hectorpalmatellez

const moment = require('moment-business-days')

module.exports = function gardel (robot) {
  'use strict'

  moment.locale('es')

  robot.respond(/(gardel|cu[aá]ndo pagan)(.*)/i, function (msg) {
    const today = moment(`${moment().format('YYYY-MM-DD')}T00:00:00-04:00`)
    const param = parseInt(msg.match[2], 10)
    const formattedParamDate = param ? moment(`${moment().format('YYYY-MM')}-${param}`) : null
    const dateWithParam = formattedParamDate ? formattedParamDate > today ? formattedParamDate : formattedParamDate.add(1, 'month') : null
    const endOfBusinessDay = moment()
      .endOf('month')
      .isBusinessDay()
      ? moment().endOf('month')
      : moment()
        .endOf('month')
        .prevBusinessDay()
    const lastBusinessDayMoment = param ? dateWithParam : endOfBusinessDay
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
