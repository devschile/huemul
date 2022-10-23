// Description:
//   Huemul te dice cuánto falta para una fecha importante definida
//
// Dependencies:
//   Moment
//
// Commands:
//   hubot 18 - Retorna la cantidad de días faltantes para el 18 de septiembre
//   hubot navidad - Retorna la cantidad de días que faltan para navidad
//   hubot año nuevo - Retorna la cantidad de días que faltan para año nuevo
//   hubot aniversario - Retorna la cantidad de días que faltan para el aniversario de devsChile
//
// Author:
//   @jorgeepunan
//   @hectorpalmatellez

const moment = require('moment')

const frases = {
  18: ['Preparen la sed.', 'Tiqui-tiqui-tíiiiiiiii', '¡A viajar fuera de Chile patriotas!', '¡Afilen las espuelas!'],
  navidad: ['¡A comprar duendes mágicos!', '¡Partiste a juntar galletas de navidad!'],
  'año nuevo': ['¡A buscar airbnb en Valparaíso!', 'Cuidao pa donde apuntai la champaña'],
  aniversario: ['¡A elegir al mejor admin del año!', '¿Ya estamo como pa cambiar admins?']
}

const pasarloBien = {
  18: ['¡A emborracharse!'],
  navidad: ['¡A comer galletas!'],
  'año nuevo': ['¡A comer lentejas!'],
  aniversario: ['¡A pitearse el :toilet: del admin!']
}

const emoji = {
  18: 'huemul-huaso',
  navidad: 'christmas_tree',
  'año nuevo': 'champagne',
  aniversario: 'devschile-love'
}

const friendlyTarget = {
  18: "pa'l 18 de septiembre",
  navidad: 'pa navidad',
  'año nuevo': 'pa año nuevo',
  aniversario: "pa'l aniversario de devsChile"
}

module.exports = robot => {
  robot.respond(/18|navidad|año nuevo|aniversario\s?(.*)/i, msg => {
    const year = new Date().getFullYear()
    const requestedDate = String(msg.match.input.replace(/huemul/g, '').trim().toLowerCase())

    const month = () => {
      switch (requestedDate) {
        case '18':
          return '09'
        case 'navidad':
          return '12'
        case 'año nuevo':
          return '01'
        case 'aniversario':
          return '03'
        default:
          break
      }
    }
    const day = () => {
      switch (requestedDate) {
        case '18':
          return '18'
        case 'navidad':
          return '25'
        case 'año nuevo':
          return '01'
        case 'aniversario':
          return '08'
        default:
          break
      }
    }

    const date = new Date(`${year}-${month()}-${day()}`)
    let eventDate = moment(date).add(1, 'days')
    const weekday = eventDate.format('dddd')
    const todaysDate = moment()

    if (todaysDate.isAfter(eventDate)) {
      eventDate = eventDate.add(1, 'Y')
    }

    const daysleft = eventDate.diff(todaysDate, 'days')
    if (daysleft === 0) {
      msg.send(`:calendar: ¡Hoy es ${requestedDate}! ${msg.random(pasarloBien[requestedDate])}`)
    } else {
      msg.send(`:hourglass: Quedan ${daysleft} días ${friendlyTarget[requestedDate]}, que será día ${weekday}`)
      msg.send(`:${emoji[requestedDate]}: ${msg.random(frases[requestedDate])}`)
    }
  })
}
