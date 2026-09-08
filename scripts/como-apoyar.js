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
//   hubot como donar - Explica que ya no se reciben donaciones, solo suscripciones
//   hubot cómo donar - Explica que ya no se reciben donaciones, solo suscripciones
//
// Authors:
//   @jorgeepunan @hectorpalmatellez

const SUPPORT_AMOUNT = process.env.SUBSCRIPTION_AMOUNT || '$4.000'
const PAYMENT_METHODS = new Map([
  [
    'devsChile gold',
    'Hazte socio en <https://gold.devschile.cl|gold.devschile.cl>: pagas con tarjeta o débito, quedas con cuenta propia y la membresía se activa sola.'
  ],
  [
    'Suscripción mensual',
    'Si prefieres que se renueve solo, la <https://app.reveniu.com/checkout-custom-link/9VamNpRD9b0LNZ3N4NAl2MG5TyY98zln|suscripción mensual por Reveniu> sigue disponible y también te deja como socio gold.'
  ],
  [
    'Transferencia',
    `Puedes transferir ${SUPPORT_AMOUNT} en pesos chilenos a través de la cuenta de :devschile:, escríbele a un admin para que te dé la info bancaria.`
  ]
])

const DONATION_TEXT =
  'Por motivos legales y tributarios ya no recibimos donaciones: el apoyo a la comunidad se realiza exclusivamente mediante suscripción. Escribe `huemul cómo apoyar` para conocer las opciones disponibles.'
const DONATION_FOOTER =
  'Gracias :pray: por el interés en aportar :gold: a que siga creciendo la comunidad devsChile.'

module.exports = robot => {
  robot.respond(/c(o|ó)mo donar/i, msg => {
    if (['SlackBot', 'Room'].includes(robot.adapter.constructor.name)) {
      const options = {
        as_user: true,
        link_names: 1,
        unfurl_links: false,
        attachments: [
          {
            fallback: DONATION_TEXT,
            text: DONATION_TEXT,
            title: 'Cómo donar',
            title_link: 'https://devschile.cl/',
            footer: DONATION_FOOTER
          }
        ]
      }
      robot.adapter.client.web.chat.postMessage(msg.message.room, null, options)
    } else {
      msg.send(DONATION_TEXT)
    }
  })

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
