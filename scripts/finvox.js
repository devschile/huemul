// Description:
//   Obtiene indicadores económicos para Chile
//
// Dependencies:
//   numberToCLPFormater
//
// Configuration:
//   None
//
// Commands:
//   hubot finvox help - Imprime la ayuda
//   hubot finvox dolar|usd|uf|euro|ipc|utm|huemulcoin - Obtiene el valor de la moneda seleccionada
//
// Author:
//   @jorgeepunan

const CLP = require('numbertoclpformater').numberToCLPFormater
const API_URL = process.env.API_URL || 'https://mindicador.cl/api/'
const mensajes = [
  'Aunque te esfuerces, seguirás siendo pobre. :poop:',
  'Los políticos ganan más que tú y más encima nos roban. Y no pueden irse presos. ¡Ánimo! :monkey:',
  'La economía seguirá mal para ti, pero no para tu AFP. :moneybag:',
  'Algún día saldrás de la clase media. Partiste a jugarte un LOTO. :alien:',
  'Todos los días suben los precios, y no tu sueldo. :money_with_wings:'
]

const numberWithCommas = number => number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')

const numberSplitDecimal = number => {
  const d = Math.pow(10, 2)
  return (parseInt(number * d, 10) / d).toFixed(number)
}

module.exports = robot => {
  robot.respond(/finvox (\w+)/i, res => {
    let uri
    const indicador = res.match[1].toLowerCase()
    const indicadores = ['uf', 'dolar', 'usd', 'euro', 'eur', 'ipc', 'utm', 'getonbrd', 'huemulcoin']

    if (indicadores.includes(indicador)) {
      uri = API_URL
    } else {
      res.send(
        'Mis comandos son:\n\n * `finvox dolar|usd`\n * `finvox euro|eur`\n * `finvox uf`\n * `finvox utm`\n * `finvox ipc`\n * `finvox getonbrd`\n * `finvox huemulcoin`\n'
      )
      return false
    }

    robot.http(uri).get()((err, response, body) => {
      if (err) {
        robot.emit('error', err, res, 'finvox')
        res.send(`Ocurrió un error: ${err.message}`)
        return
      }

      response.setEncoding('utf-8')
      let data = JSON.parse(body)
      const date = data.fecha.split('T')[0]

      if (!data && ['dolar', 'usd', 'getonbrd', 'euro', 'eur', 'huemulcoin'].includes(indicador)) {
        return res.send('Sin resultados')
      }
      if (indicador === 'uf') {
        data = CLP(data.uf.valor)
      } else if (['dolar', 'usd'].includes(indicador)) {
        data = CLP(data.dolar.valor)
      } else if (indicador === 'getonbrd') {
        const complexGetonbrdCalculus = parseInt(data.dolar.valor, 10) * 1231
        data = `1₲ = $${numberWithCommas(complexGetonbrdCalculus)}`
      } else if (['euro', 'eur'].includes(indicador)) {
        data = CLP(data.euro.valor)
      } else if (indicador === 'ipc') {
        data = `${data.ipc.valor}%`
      } else if (indicador === 'utm') {
        data = CLP(data.utm.valor)
      } else if (indicador === 'huemulcoin') {
        const complexHuemulCoinCalculus = 1000 / parseInt(data.dolar.valor)
        data = `1ℌℭ = US$${numberSplitDecimal(complexHuemulCoinCalculus)}`
      } else {
        data = '`finvox help` para ayuda.'
      }
      if (data !== null && typeof data !== 'object') {
        data = data.toString().split(',', 1)
        const mensaje = res.random(mensajes)
        res.send(`${indicador.toUpperCase()}: ${data} (${date}). ${mensaje}`)
      } else {
        res.send('Error, intenta nuevamente *zopenco*.')
      }
    })
  })
}
