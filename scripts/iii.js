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
//   hubot iii <texto>
//
// Example:
//   hubot iii mi presidente es el mejor de todos
//   mi prisidinti is il mijir di tidis
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
