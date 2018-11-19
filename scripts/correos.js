// Description:
//   Get the latest status of a shipment from Correos de Chile
//
// Dependencies:
//   correos-chile
//
// Commands:
//   hubot correos [envio]
//
// Author:
//   @hectorpalmatellez

const correos = require('correos-chile')

module.exports = robot => {
  robot.respond(/correos (.*)/i, async res => {
    const send = options => {
      if (['SlackBot', 'Room'].includes(robot.adapter.constructor.name)) {
        robot.adapter.client.web.chat.postMessage(res.message.room, null, options)
      } else {
        res.send(options.attachments[0].fallback)
      }
    }
    const sendError = (options, message) => {
      options.attachments[0].fallback = message || 'Búsqueda sin resultados'
      options.attachments[0].text = options.attachments[0].fallback
      options.attachments[0].color = 'danger'
      send(options)
    }
    const options = {
      as_user: false,
      link_names: 1,
      icon_url: 'https://i.imgur.com/2KiVYGp.png',
      username: 'Correos de Chile',
      unfurl_links: false,
      attachments: [{}]
    }

    try {
      const results = await correos([res.match[1]])
      if (results.length === 0) return sendError(options)
      if (typeof results[0] === 'string') return sendError(options, results[0])
      if (results[0].registros.length === 0) sendError(options)
      const { estado, fecha, lugar } = results[0].registros.sort((a, b) => {
        const dateA = new Date(a.fecha.replace(/(\d+)\/(\d+)\/(\d+) (\d+:\d+)/, '$3-$2-$1 $4'))
        const dateB = new Date(b.fecha.replace(/(\d+)\/(\d+)\/(\d+) (\d+:\d+)/, '$3-$2-$1 $4'))
        return dateA < dateB
      })[0]
      const text = [`- Envío: ${res.match[1]}`, `- Estado: ${estado}`, `- Fecha: ${fecha}`, `- Lugar: ${lugar}`].join(
        '\n'
      )
      options.attachments[0].fallback = text
      options.attachments[0].color = 'good'
      options.attachments[0].fields = [
        {
          title: 'Envío',
          value: res.match[1],
          short: true
        },
        {
          title: 'Estado',
          value: estado,
          short: true
        },
        {
          title: 'Fecha',
          value: fecha,
          short: true
        },
        {
          title: 'Lugar',
          value: lugar,
          short: true
        }
      ]
      send(options)
    } catch (err) {
      robot.emit('error', err, res)
      sendError(options)
    }
  })
}
