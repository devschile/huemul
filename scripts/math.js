// Description:
//   Hubot hace cálculos por ti
//
// Dependencies:
//   mathjs
//
// Configuration:
//   None
//
// Commands:
//   hubot calcula <expresion>
//   hubot convierte <expresion> to/in <unidad> (TODO: convertir la expresion a español)
//
// Notes
//   + info: http://mathjs.org/examples/expressions.js.html
//
// Author:
//   @juanbrujo

module.exports = function (robot) {
  robot.respond(/(calcula|convierte|math|conv)( me)? (.*)/i, function (msg) {
    msg.send('DEPRECADO PORQUE TAMALO')
  })
}
