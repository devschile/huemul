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
//   hubot orionx chaucha | chaucha
//
// Author:
//   @gmq

const number = require('numbertoclpformater').numberToCLPFormater

module.exports = robot => {
  robot.respond(/orionx (.*)/i, msg => {
    const coin = msg.match[1]
    const coinId = getCoinId(coin)
    msg.send('Consultando último valor con orionx... :clock5:')

    getOrionxHistory(coinId, msg)
      .then(lastResult => {
        msg.send(`1 ${coin} está a ${number(lastResult, 'CLP $')} en orionx`)
      })
      .catch(err => {
        msg.send(`Error al realizar la búsqueda.`)
      })
  })

  function getCoinId(coin) {
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

  function getOrionxHistory(coinId, msg) {
    const url = 'http://api.orionx.io/graphql'
    const query = `{
      marketTradeHistory(marketCode: "${coinId}") {
        _id
        amount
        price
        totalCost
        date
      }
    }`

    return new Promise((resolve, reject) => {
      msg.http(`${url}?query=${query}`).get()((err, res, body) => {
        if (err) {
          console.log(err)
          reject(err)
        }

        const json = JSON.parse(body)
        if (json.data && json.data.marketTradeHistory && json.data.marketTradeHistory[0]) {
          resolve(json.data.marketTradeHistory[0].price)
        } else {
          reject()
        }
      })
    })
  }
}
