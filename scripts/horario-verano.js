// Description:
//   Huemul te dice cuando comienza el horario de verano y cuando termina del presente año
//
// Dependencies:
//   Moment
//
// Commands:
//   hubot horario verano inicio - Retorna el dia que comienza el horario de verano del presente año
//   hubot horario verano fin - Retorna el dia que termina el horario de verano del presente año
//
// Author:
//   @jorgeepunan

const moment = require('moment')

module.exports = robot => {
  robot.respond(/horario verano (\w+)/i, msg => {
    const what = msg.match[1]
    const year = new Date().getFullYear()
    const monthEnd = 3
    const monthBegin = 8
    let date = null

    if (what === 'inicio') {
      date = moment([year, monthBegin])
      msg.send(`:alarm_clock: El horario de verano este ${year} comienza el domingo ${date.day(+7).format('DD-MM-YYYY')} a las 00:00hrs.`)
    } else if (what === 'fin') {
      date = moment([year, monthEnd])
      msg.send(`:alarm_clock: El horario de verano este ${year} termina el domingo ${date.day(+7).format('DD-MM-YYYY')} a las 00:00hrs.`)
    } else {
      msg.send(':alarm_clock: Debes elegir si quieres saber el *inicio* o *fin* del horario de verano')
    }
  })
}
