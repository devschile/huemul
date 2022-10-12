// Description:
//   Muestra el horóscopo del día según el signo
//
// Dependencies:
//   https://api.xor.cl/tyaas/
//
// Configuration:
//   None
//
// Commands:
//   hubot horóscopo <signo zodiacal> - Muestra el horóscopo del día para el signo indicado. Ejemplo: `hubot horóscopo leo`
//   hubot horoscopo <signo zodiacal> - Muestra el horóscopo del día para el signo indicado. Ejemplo: `hubot horoscopo leo`
//
// Author:
//   @jorgeepunan

const url = 'https://api.xor.cl/tyaas/'

module.exports = function (robot) {
  const signs = [
    'aries',
    'tauro',
    'geminis',
    'cancer',
    'leo',
    'virgo',
    'libra',
    'escorpion',
    'sagitario',
    'capricornio',
    'acuario',
    'piscis'
  ]
  const pattern = new RegExp(`hor[oó]scopo(\\s+(${signs.join('|')}))?$`, 'i')
  robot.respond(pattern, function (res) {
    const send = options => {
      if (['SlackBot', 'Room'].includes(robot.adapter.constructor.name)) {
        robot.adapter.client.web.chat.postMessage(res.message.room, null, options)
      } else {
        res.send(options.attachments[0].fallback)
      }
    }
    const options = {
      as_user: false,
      link_names: 1,
      icon_url: 'https://pbs.twimg.com/profile_images/706872219973120000/g0U6TyxI_400x400.jpg',
      username: 'Tía Yoli',
      unfurl_links: false,
      attachments: [{}]
    }
    const defaultError = 'Ocurrió un error con la búsqueda'
    const signo = res.match[2] ? res.match[2].toLowerCase() : null
    if (!signo) {
      const help = `Debes agregar un signo zodiacal (${signs.join(', ')}).`
      options.attachments[0].fallback = help
      options.attachments[0].text = help
      options.attachments[0].color = '#004085'
      return send(options)
    }
    robot.http(url).get()(function (err, response, body) {
      if (err || response.statusCode !== 200) {
        robot.emit('error', err || new Error(`Status code ${response.statusCode}`), res, 'horoscopo')
        options.attachments[0].fallback = defaultError
        options.attachments[0].title = `Horóscopo para ${signo}`
        options.attachments[0].text = defaultError
        options.attachments[0].color = 'danger'
        return send(options)
      }
      try {
        const data = JSON.parse(body)
        const { nombre, amor, salud, dinero, color, numero } = data.horoscopo[signo]
        const text = `
Horóscopo de ${data.titulo} para ${nombre}:
  · Amor 💖 : ${amor}
  · Salud 🤕 : ${salud}
  · Dinero 💰 : ${dinero}
  · Color 🖌 : ${color}
  · Número 🔢 : ${numero}`
        options.attachments[0].fallback = text
        options.attachments[0].title = `Horóscopo para ${signo}`
        options.attachments[0].color = 'good'
        options.attachments[0].fields = [
          {
            value: `💖 ${amor}`,
            short: false
          },
          {
            value: `🤕 ${salud}`,
            short: false
          },
          {
            value: `💰 ${dinero}`,
            short: false
          },
          {
            value: `🖌 ${color}`,
            short: true
          },
          {
            value: `🔢 ${numero}`,
            short: true
          }
        ]
        send(options)
      } catch (err) {
        robot.emit('error', err, res, 'horoscopo')
        options.attachments[0].fallback = defaultError
        options.attachments[0].title = `Horóscopo para ${signo}`
        options.attachments[0].text = defaultError
        options.attachments[0].color = 'danger'
        send(options)
      }
    })
  })
}
