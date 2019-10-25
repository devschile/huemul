// Description
//   Script de hubot para revisar si una empresa posee multas en la inspección del trabajo
//
// Dependencies:
//   rutjs
//
// Configuration:
//   None
//
// Commands:
//   hubot multas-empresa <rut> - Verifica si una empresa tiene multas
//
// Author:
//   lgaticaq

const Rut = require('rutjs')

module.exports = robot => {
  robot.respond(/multas-empresa (.+)$/i, res => {
    const _rut = new Rut(res.match[1])
    if (!_rut.isValid) return res.reply('el RUT es invalido')
    const rut = _rut.getNiceRut(false)
    const data = `__EVENTTARGET=btnConsulta&tbxRut=${rut}`
    robot
      .http('http://ventanilla.dt.gob.cl/RegistroEmpleador/consultamultas.aspx')
      .header('Content-type', 'application/x-www-form-urlencoded')
      .post(data)((err, response, body) => {
        if (err) {
          robot.emit('error', err, res, 'multas-empresa')
          return res.reply('ocurrio un error al consultar')
        }
        if (body.indexOf('0 multas encontradas') > -1) {
          res.send(`La empresa con RUT ${rut} no posee multas`)
        } else {
          res.send(`La empresa con RUT ${rut} posee multas`)
        }
      })
  })
}
