// Description:
//   Obtiene indicadores económicos para Chile
//
// Dependencies:
//   none
//
// Configuration:
//   None
//
// Commands:
//   hubot finvox help
//   hubot finvox dolar|usd
//   hubot finvox bitcoin
//   hubot finvox uf
//   hubot finvox euro
//   hubot finvox ipc
//   hubot finvox utm
//   hubot finvox huemulcoin
//
// Author:
//   @jorgeepunan

// process.env.API_URL ||= 'http://mindicador.cl/api' # old, slow and shitty
const API_URL = process.env.API_URL || 'http://indicadoresdeldia.cl/webservice/indicadores.json'
const BIT_API_URL = process.env.BIT_API_URL || 'https://blockchain.info/es/ticker'
const mensajes = [
  'Aunque te esfuerces, seguirás siendo pobre. :poop:',
  'Los políticos ganan más que tú y más encima nos roban. Y no pueden irse presos. ¡Ánimo! :monkey:',
  'La economía seguirá mal para ti, pero no para tu AFP. :moneybag:',
  'Algún día saldrás de la clase media. Partiste a jugarte un LOTO. :alien:',
  'Todos los días suben los precios, y no tu sueldo. :money_with_wings:'
]

const numberWithCommas = number =>
  number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')

const numberSplitDecimal = number => {
  const d = Math.pow(10, 2)
  return (parseInt(number * d, 10) / d).toFixed(number)
}

module.exports = robot => {
  robot.respond(/finvox (\w+)/i, res => {
    let uri
    const indicador = res.match[1].toLowerCase()
    if (indicador === 'help' || !indicador) {
      res.send('Mis comandos son:\n\n * `finvox dolar|usd`\n * `finvox euro|eur`\n * `finvox bitcoin|btc`\n * `finvox uf`\n * `finvox utm`\n * `finvox ipc`\n * `finvox getonbrd`\n * `finvox huemulcoin`\n')
      return false
    }
    const indicadors = ['uf', 'dolar', 'usd', 'euro', 'eur', 'ipc', 'utm', 'getonbrd', 'huemulcoin']
    if (indicadors.includes(indicador)) {
      uri = API_URL
    } else if (['bitcoin', 'btc'].includes(indicador)) {
      uri = BIT_API_URL
    }
    res.robot.http(uri).get()((err, response, body) => {
      if (err) {
        robot.emit('error', err, response)
        res.send(`Ocurrio un error: ${err.message}`)
        return
      }
      response.setEncoding('utf-8')
      let data = JSON.parse(body)
      let date = ` (${data.date})`
      if (indicador === 'uf') {
        data = data.indicador.uf
      } else if (['dolar', 'usd'].includes(indicador)) {
        data = data.moneda.dolar
      } else if (indicador === 'getonbrd') {
        const complexGetonbrdCalculus = parseInt(data.moneda.dolar.split('$')[1], 10) * 1231
        data = `1₲ = $${numberWithCommas(complexGetonbrdCalculus)}`
      } else if (['euro', 'eur'].includes(indicador)) {
        data = data.moneda.euro
      } else if (indicador === 'ipc') {
        data = `${data.indicador.ipc}%`
      } else if (indicador === 'utm') {
        data = data.indicador.utm
      } else if (['bitcoin', 'btc'].includes(indicador)) {
        date = ''
        const flatNumber = data.CLP.last.toString().split('.')[0]
        data = `$${numberWithCommas(flatNumber)}`
      } else if (indicador === 'huemulcoin') {
        const complexHuemulCoinCalculus = 1000 / parseInt(data.moneda.dolar.split('$')[1])
        data = `1ℌℭ = US$${numberSplitDecimal(complexHuemulCoinCalculus)}`
      } else {
        data = '`finvox help` para ayuda.'
      }
      if (data !== null && typeof data !== 'object') {
        data = data.toString().split(',', 1)
        const mensaje = res.random(mensajes)
        res.send(`${indicador.toUpperCase()}: ${data}${date}. ${mensaje}`)
      } else {
        res.send('Error, intenta nuevamente *zopenco*.')
      }
    })
  })
}
