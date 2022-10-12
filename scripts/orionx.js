// Description:
//   Hubot script para mostrar valores recientes de OrionX
//
// Dependencies:
//   numberToCLPFormater
//
// Configuration:
//   ORIONX_APIKEY, ORIONX_SECRET_KEY, ORIONX_ENDPOINT
//
// Commands:
//   hubot orionx bitcoin|btc - Muestra el valor de bitcoin desde OrionX
//   hubot orionx ethereum|eth - Muestra el valor de ethereum desde OrionX
//   hubot orionx litecoin|ltc - Muestra el valor de litecoin desde OrionX
//   hubot orionx bitcoin-cash|bch - Muestra el valor de bitcoin-cash desde OrionX
//   hubot orionx dash - Muestra el valor de dash desde OrionX
//   hubot orionx chaucha|cha - Muestra el valor de chaucha desde OrionX
//   hubot orionx ripple|xrp - Muestra el valor de ripple desde OrionX
//   hubot orionx tron|trx - Muestra el valor de tron desde OrionX
//
// Author:
//   @gmq

const { numberToCLPFormater } = require('numbertoclpformater')
const crypto = require('crypto')

module.exports = robot => {
  const getCoinId = coin => {
    const coins = {
      bitcoin: 'BTCCLP',
      btc: 'BTCCLP',
      eth: 'ETHCLP',
      ethereum: 'ETHCLP',
      litecoin: 'LTCCLP',
      ltc: 'LTCCLP',
      dash: 'DASHCLP',
      'bitcoin-cash': 'BCHCLP',
      bch: 'BCHCLP',
      cha: 'CHACLP',
      chaucha: 'CHACLP',
      ripple: 'XRPCLP',
      xrp: 'XRPCLP',
      luk: 'LUKCLP',
      luka: 'LUKCLP',
      tron: 'TRXCLP',
      trx: 'TRXCLP'
    }

    return coins[coin]
  }

  const checkApiKey = () => {
    if (!process.env.ORIONX_APIKEY) {
      robot.logger.warning('The ORIONX_APIKEY environment variable not set.')
      return false
    }
    if (!process.env.ORIONX_SECRET_KEY) {
      robot.logger.warning('The ORIONX_SECRET_KEY environment variable not set.')
      return false
    }
    return true
  }

  checkApiKey()

  const getLastPrice = coinId => {
    const url = process.env.ORIONX_ENDPOINT || 'http://api.orionx.io/graphql'
    const query = `{
      market(code: "${coinId}") {
        lastTrade {
          price
        }
      }
    }`

    return new Promise((resolve, reject) => {
      const timestamp = new Date().getTime() / 1000
      const postData = JSON.stringify({ query })
      robot
        .http(url)
        .header('Content-Type', 'application/json')
        .header('X-ORIONX-TIMESTAMP', timestamp)
        .header('X-ORIONX-APIKEY', process.env.ORIONX_APIKEY)
        .header(
          'X-ORIONX-SIGNATURE',
          crypto
            .createHmac('sha512', process.env.ORIONX_SECRET_KEY)
            .update(`${timestamp}${postData}`)
            .digest('hex')
        )
        .header('Content-Length', postData.length)
        .post(postData)((err, res, body) => {
          if (err) return reject(err)
          if (res.statusCode !== 200) {
            return reject(new Error(`Bad statusCode: ${res.statusCode}`))
          }
          try {
            const json = JSON.parse(body)
            if (json.data && json.data.market && json.data.market.lastTrade) {
              resolve(json.data.market.lastTrade.price)
            } else {
              resolve(null)
            }
          } catch (err) {
            reject(err)
          }
        })
    })
  }

  robot.respond(/orionx (.*)/i, msg => {
    if (!checkApiKey()) {
      return msg.send('Falta definir la variable ORIONX_APIKEY o ORIONX_SECRET_KEY')
    }
    const coin = msg.match[1].toLowerCase()
    const coinId = getCoinId(coin)
    if (!coinId) return msg.send('Moneda inválida o no disponible')
    msg.send('Consultando último valor con orionx... :clock5:')

    getLastPrice(coinId, msg)
      .then(price => {
        if (!price) return msg.send('Precio no encontrado')
        msg.send(`1 ${coin} está a ${numberToCLPFormater(price, 'CLP $')} en orionx`)
      })
      .catch(err => {
        robot.emit('error', err, msg, 'orionx')
        msg.send('Error al realizar la búsqueda.')
      })
  })
}
