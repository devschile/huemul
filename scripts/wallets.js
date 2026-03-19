// Description:
//   Display :huemul: addresses to receive crypto as subscriptions
//
// Dependencies:
//   none
//
// Configuration:
//   WALLET_BTC
//   WALLET_ETH
//
// Commands:
//   hubot wallet btc - Display :huemul: addresses to receive bitcoin as subscription fee
//   hubot wallet bitcoin - Display :huemul: addresses to receive bitcoin as subscription fee
//   hubot wallet eth - Display :huemul: addresses to receive ethereum as subscription fee
//   hubot wallet ethereum - Display :huemul: addresses to receive ethereum as subscription fee
//   hubot wallet help - Display help
//
// Author:
//   @hectorpalmatellez

module.exports = function (robot) {
  const WALLET_BTC = process.env.WALLET_BTC
  const WALLET_ETH = process.env.WALLET_ETH

  if (!WALLET_ETH) {
    robot.logger.warning('The WALLET_ETH variable has not been set.')
  }
  if (!WALLET_BTC) {
    robot.logger.warning('The WALLET_BTC variable has not been set.')
  }

  robot.respond(/wallet (.*)/i, function (msg) {
    const currency = msg.match[1].toLowerCase()

    if (currency === 'btc' || currency === 'bitcoin') {
      msg.send(`Mi wallet de Bitcoin para suscripciones es \`${WALLET_BTC}\``)
    } else if (currency === 'eth' || currency === 'ethereum') {
      msg.send(`Mi wallet de Ethereum para suscripciones es \`${WALLET_ETH}\``)
    } else if (currency === 'help') {
      msg.send('Por ahora solo tengo 👜 de ETH y BTC, se utiliza así: `huemul wallet btc`')
    }
  })
}
