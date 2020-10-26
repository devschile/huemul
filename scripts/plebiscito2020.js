// Description:
//  Muestra noticias para la búsqueda seleccionada desde Ahora Noticias Chile
//
// Commands:
//  hubot plebiscito - Muestra los resultados parciales del plebiscito 2020
//
// Author:
//  @raerpo

function formatNumber (number) {
  return number.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.')
}

module.exports = (robot) =>
  robot.respond(/plebiscito|plebisito|plebicito/i, (msg) => {
    const send = (text) => {
      if (robot.adapter.constructor.name === 'SlackBot') {
        const options = {
          unfurl_links: false,
          as_user: false,
          icon_url: 'https://i.imgur.com/R24p0SV.png',
          username: 'Servel'
        }
        robot.adapter.client.web.chat.postMessage(msg.message.room, text, options)
      } else {
        msg.send(text)
      }
    }
    send('Consultando al Servel :loading:')
    robot.http('http://huemul-airlines.herokuapp.com/plebiscito').get()((err, res, body) => {
      if (err) robot.emit('error', err, msg, 'noticias')
      const { apruebo, rechazo } = JSON.parse(body)
      send(
        `\n*Apruebo*: ${apruebo.percentage}% con ${formatNumber(apruebo.votes)} votos :huemul-matapacos:\n*Rechazo*: ${
          rechazo.percentage
        }% con ${formatNumber(rechazo.votes)} votos :chaleco-amarillo:`
      )
    })
  })
