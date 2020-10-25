// Description:
//  Muestra noticias para la búsqueda seleccionada desde Ahora Noticias Chile
//
// Commands:
//  hubot plebiscito - Muestra los resultados parciales del plebiscito 2020
//
// Author:
//  @raerpo

module.exports = robot =>
  robot.respond(/plebiscito|plebisito|plebicito/i, msg => {
    const send = text => {
      if (robot.adapter.constructor.name === 'SlackBot') {
        const options = { unfurl_links: false, as_user: true }
        robot.adapter.client.web.chat.postMessage(msg.message.room, text, options)
      } else {
        msg.send(text)
      }
    }
    send('Preguntándole al servel...')
    robot
      .http('http://huemul-airlines.herokuapp.com/plebiscito')
      .get()((err, res, body) => {
        if (err) {
          robot.emit('error', err, msg, 'noticias')
        } else {
          const { apruebo, rechazo } = JSON.parse(body)
          send(`\nApruebo: ${apruebo.percentage}% con ${apruebo.votes} votos :huemul-matapacos:\nRechazo: ${rechazo.percentage}% con ${rechazo.votes} votos :chaleco-amarillo:`)
        }
      })
  })
