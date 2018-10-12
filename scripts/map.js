// Description:
//   Huemul devuelve un mapa según lugar entregado
//
// Dependencies:
//   None
//
// Configuration:
//   GOOGLE_MAPS_API_KEY
//
// Commands:
//   huemul map <lugar>
//
// Author:
//   @jorgeepunan

const querystring = require('querystring')

module.exports = function(robot) {
  if (!process.env.GOOGLE_MAPS_API_KEY) {
    robot.logger.warning('The GOOGLE_MAPS_API_KEY environment variable not set.')
  }

  robot.respond(/map (.+)/i, function(msg) {
    const send = attachment => {
      if (robot.adapter.constructor.name === 'SlackBot') {
        const options = {
          as_user: false,
          link_names: 1,
          icon_url: 'https://www.google.com/images/branding/product/2x/maps_96in128dp.png',
          username: 'Google Maps',
          unfurl_links: false,
          attachments: [attachment]
        }
        robot.adapter.client.web.chat.postMessage(msg.message.room, null, options)
      } else {
        msg.send(attachment.fallback)
      }
    }
    const location = msg.match[1]
    const mapUrlParams = querystring.stringify({
      center: location,
      zoom: 15,
      size: '400x400',
      maptype: 'roadmap',
      format: 'png',
      key: process.env.GOOGLE_MAPS_API_KEY
    })
    const mapUrl = `https://maps.googleapis.com/maps/api/staticmap?${mapUrlParams}`
    const urlParams = querystring.stringify({ q: location, t: 'm', z: 12 })
    const url = `https://www.google.com/maps?${urlParams}`
    const text = `:world_map: ${url}\n:frame_with_picture: ${mapUrl}`
    robot.http(mapUrl).get()((err, resp) => {
      if (resp.headers['x-staticmap-api-warning'] === 'Error geocoding: center' || resp.statusCode !== 200 || err) {
        return send({
          fallback: `La dirección "${location}" no retorna resultados`,
          color: 'danger',
          text: `La dirección *${location}* no retorna resultados`
        })
      }
      send({
        fallback: text,
        color: 'good',
        title: location,
        title_link: url,
        image_url: mapUrl
      })
    })
  })
}
