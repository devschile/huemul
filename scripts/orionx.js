// Description:
//   Hubot script para mostrar valores recientes de OrionX
//
// Dependencies:
//   numberToCLPFormater
//
// Configuration:
//   None
//
// Commands:
//   hubot orionx bitcoin | btc
//   hubot orionx ethereum | eth
//   hubot orionx bitcoin-cash | bch
//   hubot orionx dash
//   hubot orionx chaucha | cha
//
// Author:
//   @gmq

const { numberToCLPFormater } = require('numbertoclpformater')

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
      chaucha: 'CHACLP'
    }

    return coins[coin]
  }

  const getLastPrice = coinId => {
    const url = 'http://api.orionx.io/graphql'
    const query = `{
      market(code: "${coinId}") {
        lastTrade {
          price
        }
      }
    }`

    return new Promise((resolve, reject) => {
      robot
        .http(url)
        .header('Content-Type', 'application/json')
        .post(JSON.stringify({ query }))((err, res, body) => {
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
    const coin = msg.match[1]
    const coinId = getCoinId(coin)
    if (!coinId) return msg.send('Moneda inválida o no disponible')
    msg.send('Consultando último valor con orionx... :clock5:')

    getLastPrice(coinId, msg)
      .then(price => {
        if (!price) return msg.send(`Precio no encontrado`)
        msg.send(`1 ${coin} está a ${numberToCLPFormater(price, 'CLP $')} en orionx`)
      })
      .catch(err => {
        robot.emit('error', err, msg)
        msg.send(`Error al realizar la búsqueda.`)
      })
  })
}
