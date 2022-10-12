// Description:
//   Cambia las vocales de un string a i
//
// Dependencies:
//   none
//
// Configuration:
//   none
//
// Commands:
//   hubot iii <texto> - convierte todas las vocales a i
//
// Author:
//   @madkoding

module.exports = function (robot) {
  robot.respond(/iii (.*)/i, function (msg) {
    const text = msg.match[1]
    const iii = text.replace(/[aáeéoóuúí]/ig, 'i')
    msg.send(iii)
  })
}
