// Description:
//   Huemul explica con peras y manzanas cómo apoyar a la comunidad
//
// Dependencies:
//   None
//
// Configuration:
//   None
//
// Commands:
//   hubot como apoyar - Muestra las instrucciones de cómo apoyar
//   hubot cómo apoyar - Muestra las instrucciones de cómo apoyar
//
// Authors:
//   @jorgeepunan @hectorpalmatellez

const SUPPORT_AMOUNT = process.env.SUBSCRIPTION_AMOUNT || 'US$5'
const PAYMENT_METHODS = new Map([
  [
    'Suscripción',
    'Usamos Reveniu para recibir <https://app.reveniu.com/checkout-custom-link/9VamNpRD9b0LNZ3N4NAl2MG5TyY98zln| suscripciones con tarjetas de crédito y débito>. Puedes elegir entre un <https://app.reveniu.com/checkout-custom-link/X6wYvaeZJ4RDFJFKEF93bTBEUOXhTUVV|pago único> o una <https://app.reveniu.com/checkout-custom-link/9VamNpRD9b0LNZ3N4NAl2MG5TyY98zln|suscripción mensual>.'
  ],
  [
    'Transferencia',
    `Puedes transferir en pesos chilenos lo equivalente a ${SUPPORT_AMOUNT} a través de la cuenta de :devschile:, escríbele a un admin para que te dé la info bancaria.`
  ]
])

module.exports = robot => {
  robot.respond(/c(o|ó)mo apoyar/i, msg => {
    const text =
      `Para mantener el servidor donde se aloja el :robot_face: :huemul: y otros proyectos que creamos desde y para la comunidad, se reciben aportes desde ${SUPPORT_AMOUNT} por diferentes medios`
    const footer =
      'Gracias :pray: por el interés y por las ganas de aportar :gold: a que siga creciendo la comunidad devsChile. Hacemos buen uso de los aportes, desde el pago de los servidores hasta concursos y sorteos de cursos en Udemy, entre otros. :heartbeat:'
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
            title: 'Cómo apoyar',
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
