// Description:
//   Huemul explica con peras y manzanas cómo donar a la comunidad
//
// Dependencies:
//   None
//
// Configuration:
//   None
//
// Commands:
//   hubot como donar - Muestra las instrucciones de cómo donar
//   hubot cómo donar - Muestra las instrucciones de cómo donar
//
// Author:
//   @jorgeepunan

const WALLET_BTC = process.env.WALLET_BTC
const WALLET_ETH = process.env.WALLET_ETH
const DONATION_AMOUNT = process.env.DONATION_AMOUNT || 'US$10'
const PAYMENT_METHODS = new Map([
  [
    'Débito, Crédito',
    'Desde el mismo sitio devschile.cl, abajo hay 2 botones: Donación voluntaria para mantener el servidor, e Impuesto Huemul por cambio de trabajo, también voluntario.'
  ],
  [
    'Transferencia',
    `Puedes transferir en pesos chilenos lo equivalente a los ${DONATION_AMOUNT} a través de la cuenta del tesorero :gmq:, DM con él para su info bancaria.`
  ],
  [
    'Suscripción mensual',
    'Desde el mismo sitio devschile.cl, abajo hay un mensaje donde se permite suscribirte a que dones mensualmente a través del gateway integrado. Es la manera más cómoda de aportar a devsChile.'
  ],
  [
    'Compra de swags',
    'Tenemos una tienda virtual donde podrás estar a la moda y adquirir artículos exclusivos hechos para la comunidad, con stock y nuevos productos siempre actualizándose. Pago con débito / crédito y envío incluído. https://tienda.devschile.cl/'
  ],
  ['Cryptos', `Recibimos lo equivalente a ${DONATION_AMOUNT} en las wallets:\n₿ \`${WALLET_BTC}\`\nΞ \`${WALLET_ETH}\``]
])

module.exports = robot => {
  robot.respond(/c(o|ó)mo donar/i, msg => {
    const text =
      'Para mantener el servidor donde se aloja el :robot_face: :huemul: y otros proyectos que creamos desde y para la comunidad, se reciben donaciones desde US$10 por diferentes medios'
    const footer =
      'Gracias :pray: por el interés y por las ganas de aportar :gold: a que siga creciendo la comunidad devsChile. Hacemos buen uso de las donaciones, desde el pago de los _servers_ hasta concursos y sorteos de cursos Udemy entre otros. :heartbeat:'
    const fields = []
    let payments = ''
    PAYMENT_METHODS.forEach((value, title) => {
      fields.push({ title, value, short: false })
      payments += `· *${title}*: ${value}\n`
    })
    const fallback = `${text}:\n${payments}${footer}`
    if (['SlackBot', 'Room'].includes(robot.adapter.constructor.name)) {
      const options = {
        as_user: true,
        link_names: 1,
        unfurl_links: false,
        attachments: [
          {
            fallback,
            text,
            title: 'Cómo donar',
            title_link: 'https://devschile.cl/',
            fields,
            footer
          }
        ]
      }
      robot.adapter.client.web.chat.postMessage(msg.message.room, null, options)
    } else {
      msg.send(fallback)
    }
  })
}
