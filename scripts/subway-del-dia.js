// Description:
//   Entrega el sandwich de Subway con descuento del día en Chile
//
// Dependencies:
//   None
//
// Configuration:
//   None
//
// Commands:
//   hubot subway - Entrega el sandwich de Subway con descuento del día en Chile
//
// Author:
//   @jorgeepunan

const sandwiches = [
  'de Jamón de Pavo',
  'Trío de Carnes',
  'de Pizza',
  'de Pollo Apanado',
  'B.M.T',
  'de Costillas BBQ Melt',
  'Toscano'
]
const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

module.exports = function (robot) {
  robot.respond(/subway/i, function (res) {
    const currentWeekDayNum = new Date().getDay()
    res.send(
      `Hoy *${days[currentWeekDayNum]}* el sandwich del día en todos los Subway es el *${
        sandwiches[currentWeekDayNum]
      }*. Precio: $1.990 el de 15 cms.`
    )
  })
}
