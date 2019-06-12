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

  /**
   * @typedef {Object} GeocodeResultsGeometryLocation
   * @property {number} lat - Latitude
   * @property {number} lng - Longitude
   */
  /**
   * Get coordinates (lat, lng) for an address.
   *
   * @param {string} address -
   * @returns {Promise<GeocodeResultsGeometryLocation>} -
   */
  const getCoordinates = async address => {
    return new Promise((resolve, reject) => {
      const query = querystring.stringify({
        address,
        key: process.env.GOOGLE_MAPS_API_KEY
      })
      const endpoint = `https://maps.googleapis.com/maps/api/geocode/json?${query}`
      robot.http(endpoint).get()((err, resp, raw) => {
        try {
          const body = JSON.parse(raw)
          if (err) {
            reject(err)
          } else if (resp.statusCode !== 200) {
            reject(new Error(`Ìnvalid statusCode: ${statusCode}`))
          } else if (body.status !== 'OK') {
            reject(new Error(body.error_message))
          } else {
            resolve(body.results[0].geometry.location)
          }
        } catch (err) {
          reject(err)
        }
      })
    })
  }

  /**
   * Get location from a latitude and longitud.
   *
   * @param {number} latitude -
   * @param {number} longitude -
   * @returns {string} -
   */
  const getLocation = (latitude, longitude) => `${latitude},${longitude}`

  /**
   * Get MAP image URL (png) for a location (lat, lng).
   *
   * @param {string} location - A valid location ('address', 'lat,lng')
   * @returns {Promise<string>} -
   */
  const getMapUrl = (location) => {
    return new Promise((resolve, reject) => {
      const mapUrlParams = querystring.stringify({
        center: location,
        zoom: 15,
        size: '400x400',
        maptype: 'roadmap',
        format: 'png',
        key: process.env.GOOGLE_MAPS_API_KEY,
        markers: `color:red|${location}`
      })
      const url = `https://maps.googleapis.com/maps/api/staticmap?${mapUrlParams}`
      robot.http(url).get()((err, resp) => {
        if (resp.headers['x-staticmap-api-warning'] === 'Error geocoding: center') {
          reject(new Error(resp.headers['x-staticmap-api-warning']))
        } else if (resp.statusCode !== 200 || err) {
          reject(new Error(`Ìnvalid statusCode: ${statusCode}`))
        } else if (err) {
          reject(err)
        } else {
          resolve(url)
        }
      })
    })
  }

  robot.respond(/map (.+)/i, async msg => {
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

    const address = msg.match[1]

    try {
      const coordinates = await getCoordinates(address)
      const location = getLocation(coordinates.lat, coordinates.lng)
      const mapUrl = await getMapUrl(location)
      const urlParams = querystring.stringify({ q: location, t: 'm', z: 12 })
      const url = `https://www.google.com/maps?${urlParams}`
      const text = `:world_map: ${url}\n:frame_with_picture: ${mapUrl}`
      send({
        fallback: text,
        color: 'good',
        title: address,
        title_link: url,
        image_url: mapUrl
      })
    } catch (err) {
      return send({
        fallback: `La dirección "${address}" no retorna resultados`,
        color: 'danger',
        text: `La dirección *${address}* no retorna resultados`
      })
    }
  })
}
