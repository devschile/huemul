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

const DONATION_AMOUNT = process.env.DONATION_AMOUNT || 'US$10'
const PAYMENT_METHODS = new Map([
  [
    'Débito, Crédito',
    'Usamos Reveniu para recibir <https://app.reveniu.com/huemul|donaciones con tarjetas de crédito y débito>. Puedes elegir entre un pago único o una suscripción mensual.'
  ],
  [
    'Transferencia',
    `Puedes transferir en pesos chilenos lo equivalente a los ${DONATION_AMOUNT} a través de la cuenta de :gmq:, DM con él para su info bancaria.`
  ]
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
