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

module.exports = function (robot) {
  robot.respond(/(cmc|coinmarketcap) (.*)/i, function (msg) {
    const currency = msg.match[2]
    const url = `https://api.coinmarketcap.com/v1/ticker/${currency}/?convert=CLP`

    robot.http(url).get()(function (err, res, body) {
      if (robot.golden.isGold(msg.message.user.name)) {
        if (currency === 'help') {
          msg.send('Ejemplos de comando: \n * `huemul coinmarketcap bitcoin` \n * `huemul cmc htmlcoin`')
        } else {
          if (err || res.statusCode !== 200) {
            msg.send(`Moneda no encontrada. Para ejemplos usa \`${msg.match[1]} help\``)
          } else {
            res.setEncoding('utf-8')
            const data = JSON.parse(body)
            if (data) {
              return (() => {
                const priceCLP = CLP(data[0].price_clp, 'CLP$', true)
                msg.send(`1 *${currency}* está a ${priceCLP} según Coinmarketcap.`)
              })()
            } else {
              msg.send('ERROR')
            }
          }
        }
      } else {
        msg.send(
          'Esta funcionalidad es exclusiva para socios golden :monea: de devsChile. Dona en www.devschile.cl para unirte y utilizarla.'
        )
      }
    })
  })
}
