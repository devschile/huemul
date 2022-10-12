// Description:
//  entrega un número de RUT válido aleatorio
//
// Dependencies:
//  rutjs
//
// Configuration:
//   None
//
// Commands:
//   hubot dame un rut - Entrega un RUT aleatorio de persona
//   hubot dame un rut persona - Entrega un RUT aleatorio de persona
//   hubot dame un rut empresa - Entrega un RUT aleatorio de empresa
//
// Author:
//   @jorgeepunan

var Rut = require('rutjs')
var generar = function (type) {
  var min
  var max
  if (type === 'empresa') {
    min = 50000000
    max = 90000000
  } else {
    min = 5000000
    max = 25000000
  }
  var numAleatorio = Math.round(Math.random() * (max - min)) + min
  var rut = new Rut(numAleatorio.toString(), true)
  return rut.getNiceRut()
}

module.exports = function (robot) {
  robot.respond(/dame un rut(\s+)?(persona|empresa)?$/i, function (res) {
    var type = res.match[2] || 'persona'
    res.send('Un RUT: ' + generar(type))
  })
}
