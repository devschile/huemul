// Description:
//   Indica si el auto asociado a la patente indicada ha sido rematado
//
// Dependencies:
//   None
//
// Configuration:
//   None
//
// Commands:
//   hubot <patente> fue rematado|ha sido rematado? - Indica si el auto asociado a la patente indicada ha sido rematado
//
// Author:
//   @victorsanmartin

module.exports = robot => {
  robot.respond(/([A-Za-z]{2,4}[0-9]{2,4}) (fue|ha sido) rematado\?/i, res => {
    const patente = res.match[1].toLowerCase()
    const uri = `http://especial.t13.cl/consulta-patente/index.php?patent=${patente}`
    robot.http(uri).get()((err, response, body) => {
      if (err) {
        robot.emit('error', err, res, 'fue-rematado')
        res.send(`Ocurrio un error: ${err.message}`)
        return
      }
      const data = JSON.parse(body)
      if (data.Patente === 'No Encontrado') {
        res.send('El :car: no ha sido rematado.')
      } else {
        res.send(`Si, el :car: ${data.Marca} ${data.Modelo} fue rematado el ${data.FechaRemate}.`)
      }
    })
  })
}
