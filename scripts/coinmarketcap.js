// Description:
//   Displays value of crypto currency from Coinmarketcap
//
// Dependencies:
//   None
//
// Configuration:
//   None
//
// Commands:
//   hubot cmc|coinmarketcap help - Print help
//   hubot cmc|coinmarketcap <cryptcurrency_name> - Get value of cryptcurrency name
//
// Author:
//   @hectorpalmatellez

const CLP = require('numbertoclpformater').numberToCLPFormater
const { GOLD_DENIAL } = require('./helpers/gold-gate')

module.exports = function (robot) {
  robot.respond(/(cmc|coinmarketcap) (.*)/i, function (msg) {
    if (!robot.golden.isGold(msg.message.user)) {
      return msg.send(GOLD_DENIAL)
    }

    const currency = msg.match[2]
    if (currency === 'help') {
      return msg.send('Ejemplos de comando: \n * `huemul coinmarketcap bitcoin` \n * `huemul cmc htmlcoin`')
    }

    const url = `https://api.coinmarketcap.com/v1/ticker/${currency}/?convert=CLP`

    robot.http(url).get()(function (err, res, body) {
      if (err || res.statusCode !== 200) {
        return msg.send(`Moneda no encontrada. Para ejemplos usa \`${msg.match[1]} help\``)
      }
      res.setEncoding('utf-8')
      const data = JSON.parse(body)
      if (!data) {
        return msg.send('ERROR')
      }
      const priceCLP = CLP(data[0].price_clp, 'CLP$', true)
      msg.send(`1 *${currency}* está a ${priceCLP} según Coinmarketcap.`)
    })
  })
}
