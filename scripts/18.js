// Description:
//   Huemul te dice cuánto falta pal 18 de septiembre en Chile, fiestas patrias.
//
// Dependencies:
//   Moment
//
// Commands:
//   hubot 18 - Retorna la cantidad de días faltantes para el 18 de septiembre
//
// Author:
//   @jorgeepunan

const moment = require('moment')

const frases = ['Preparen la sed.', 'Tiqui-tiqui-tíiiiiiiii', '¡A viajar fuera de Chile patriotas!', '¡Afilen las espuelas!']

module.exports = robot => {
  robot.respond(/18\s?(.*)/i, msg => {
    const year = new Date().getFullYear()
    const month = 8 // Septiembre
    const day = 19 // 18

    let eventDate = moment([year, month, day])
    const todaysDate = moment()

    if (todaysDate.isAfter(eventDate)) {
      eventDate = eventDate.add(1, 'Y')
    }

    const daysleft = eventDate.diff(todaysDate, 'days')
    console.log('daysleft', daysleft)
    if (daysleft === 0) {
      msg.send(':flag-cl: ¡Hoy es 18! ¡A emborracharse!')
    } else {
      const pluralS = daysleft === 1 ? ['', ''] : ['s', 's']
      const pluralN = daysleft === 1 ? ['', ''] : ['n', 'n']
      msg.send(`:flag-cl: Queda${pluralN[0]} ${daysleft} día${pluralS[0]} pa'l 18 de septiembre.`)
      msg.send(`:huemul-huaso: ${msg.random(frases)}`)
    }
  })
}
