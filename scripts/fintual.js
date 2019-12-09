// Description:
//   Obtiene valores de los distintos fondos de la AGF Fintual
//
//
// Commands:
//   hubot fintual help - Imprime la ayuda
//   hubot fintual risky-a|risky-apv|clooney-a|clooney-apv|streep - Obtiene el valor del fondo seleccionado
//
// Author:
//   @cvallejos

const API_URL = process.env.API_URL || 'https://fintual.cl/api/real_assets/'
/* const mensajes = [
  'Aunque te esfuerces, seguirás siendo pobre. :poop:',
  'Los políticos ganan más que tú y más encima nos roban. Y no pueden irse presos. ¡Ánimo! :monkey:',
  'La economía seguirá mal para ti, pero no para tu AFP. :moneybag:',
  'Algún día saldrás de la clase media. Partiste a jugarte un LOTO. :alien:',
  'Todos los días suben los precios, y no tu sueldo. :money_with_wings:'
] */

var NORRIS_A = 'norris-a'
var NORRIS_APV = 'norris-apv'
var PITT_A = 'pitt-a'
var PITT_APV = 'pitt-apv'
var CLOONEY_A = 'clooney-a'
var CLOONEY_APV = 'clooney-apv'
var STREEP_A = 'streep-a'

const series = []
series[NORRIS_A] = 186
series[NORRIS_APV] = 245
series[PITT_A] = 187
series[PITT_APV] = 246
series[CLOONEY_A] = 188
series[CLOONEY_APV] = 247
series[STREEP_A] = 15077

const comands = [NORRIS_A, NORRIS_APV, PITT_A, PITT_APV, CLOONEY_A, CLOONEY_APV, STREEP_A]

module.exports = robot => {
  robot.respond(/fintual (\w+)[-](\w+)/i, res => {
    let uri
    const indicador = res.match[0].replace('huemul fintual ', '').toLowerCase()
    res.send(indicador)
    if (comands.includes(indicador)) {
      const today = new Date()
      const endDate = new Date()
      endDate.setDate(today.getDate() - 30)
      uri = API_URL + series[indicador] + '/days?from_date=' + endDate.toISOString().slice(0, 10) + '&to_date=' + today.toISOString().slice(0, 10)
    } else {
      res.send(
        'Mis comandos son:\n\n * `fintual ' + NORRIS_A + '|' + NORRIS_APV + '`\n * `fintual ' + PITT_A + '|' + PITT_APV + '`\n * `fintual ' + CLOONEY_A + '|' + CLOONEY_APV + '`\n * `fintual ' + STREEP_A + '`\n'
      )
      return false
    }

    robot.http(uri).get()((err, response, body) => {
      if (err) {
        robot.emit('error', err, res, 'fintual')
        res.send(`Ocurrió un error: ${err.message}`)
        return
      }

      response.setEncoding('utf-8')
      const data = JSON.parse(body)
      if (!data && comands.includes(indicador)) {
        return res.send('Sin resultados')
      }
      const firstElement = data.data[0]
      const lastElement = data.data[data.data.length - 1]
      const retorno = parseFloat(((lastElement.attributes.price / firstElement.attributes.price) - 1) * 100).toFixed(2)
      if (!isNaN(retorno)) {
        const rentabilidad = retorno + '%'
        // const mensaje = res.random(mensajes)
        res.send(`${indicador.toUpperCase()}: La rentabilidad del ultimo mes fue de ${rentabilidad}`)
      } else {
        res.send('Error, intenta nuevamente *:c3:*.')
      }
    })
  }
  )
}
