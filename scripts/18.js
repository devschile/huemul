// Description:
//   Huemul te dice cuánto falta pal 18 de septiembre en Chile, fiestas patrias.
//
// Dependencies:
//   Moment
//
// Commands:
//   huemul 18
//
// Author:
//   @jorgeepunan

const moment = require('moment')
const frases = ['Preparen la sed.', 'Tiqui-tiqui-tíiiiiiiii', '¡A viajar fuera de Chile patriotas!']

module.exports = robot => {
  robot.respond(/18\s?(.*)/i, msg => {
    const eventdate = moment('2019-09-18')
    const todaysdate = moment()
    const daysleft = eventdate.diff(todaysdate, 'days')
    if (daysleft === 0) {
      msg.send(`:flag-cl: ¡Hoy es 18! ¡A emborracharte!`)
    } else {
      msg.send(`:flag-cl: Quedan ${daysleft} días pa'l 18 de septiembre.`)
      msg.send(`:huemul-huaso: ${msg.random(frases)}`)
    }
  })
}
