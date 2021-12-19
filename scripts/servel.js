// Description:
//  Muestra datos de Servel para Presidenciables Chile 2021
//
// Commands:
//  hubot servel - Muestra los resultados parciales de Presidenciables Chile 2021
//
// Author:
//  @raerpo
//  @jorgeepunan

module.exports = (robot) =>
  robot.respond(/servel/i, (msg) => {
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
    send('Vamos al Servel :loading:')
    robot.http('https://www.servelelecciones.cl/data/elecciones_presidente/computo/global/19001.json').get()((err, res, body) => {
      if (err) robot.emit('error', err, msg, 'servel')
      const votos = JSON.parse(body)
      send(
`Total mesas escrutadas: *${votos.totalMesasPorcent}*
*${votos.data[0].a}*: ${votos.data[0].d} con ${votos.data[0].c} votos.
*${votos.data[1].a}*: ${votos.data[0].d} con ${votos.data[0].c} votos.
*Resumen:*
 - Válidamente emitidos: ${votos.resumen[0].d}.
 - Null: ${votos.resumen[1].d}.
 - White: ${votos.resumen[2].d}.
 - Total: ${votos.resumen[3].d}.
`
      )
    })
  })
