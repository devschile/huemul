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
//   :huemul:

var mathjs = require("mathjs");

module.exports = function(robot) {

  robot.respond(/(calcula|convierte|math|conv)( me)? (.*)/i, function(msg) {
    var error, error1, result;

    try {
      msg.send("DEPRECADO PORQUE TAMALO");

    } catch (error) {

      msg.send('No se ha podido ejecutar correctamente el cálculo.');

    }

  });

};
