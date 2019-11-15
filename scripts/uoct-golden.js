// Description:
//   Hubot script exclusivo para usuarios devsChile golden :monea: que muestra problemas de tránsito en Santiago (por ahora), Chile.
//
//  Dependencies:
//    cheerio
//
// Commands:
//   hubot uoct - Muestra problemas de tránsito en Santiago.
//   hubot taco - Muestra problemas de tránsito en Santiago.
//   hubot transito - Muestra problemas de tránsito en Santiago.
//   hubot tránsito - Muestra problemas de tránsito en Santiago.
//
// Author:
//   @jorgeepunan, @davidlaym

const fetch = require('node-fetch')
const { URLSearchParams } = require('url')

/**
 * @typedef {Object} Event
 * @property {number} ID
 * @property {string} post_author
 * @property {string} post_date
 * @property {string} post_date_gmt
 * @property {string} post_content
 * @property {string} post_title
 * @property {string} post_excerpt
 * @property {string} post_status
 * @property {string} comment_status
 * @property {string} ping_status
 * @property {string} post_password
 * @property {string} post_name
 * @property {string} to_ping
 * @property {string} pinged
 * @property {string} post_modified
 * @property {string} post_modified_gmt
 * @property {string} post_content_filtered
 * @property {number} post_parent
 * @property {string} guid
 * @property {number} menu_order
 * @property {string} post_type
 * @property {string} post_mime_type
 * @property {string} comment_count
 * @property {string} filter
 * @property {string} url
 * @property {string} time
 */
/**
 * @typedef {Object} Response
 * @property {string} response
 * @property {Array<Event>} data
 */
/**
 * @param {Event} event
 * @returns {string}
 */
const fallbackText = event => `${event.post_modified}: ${event.post_title}\n`

/**
 * @param {Event} event
 * @returns {string}
 */
const attachmentText = event => `<${event.url}|${event.post_modified}: ${event.post_title}>\n`

/**
 * @param {Array<Event>} events
 * @param {boolean} [fallback=false]
 * @returns {string}
 */
const parseEvents = (events, fallback = false) => {
  const parser = fallback ? fallbackText : attachmentText
  return events
    .sort((firstEvent, secondEvent) => firstEvent.post_modified < secondEvent.post_modified)
    .reduce((text, event) => {
      text += parser(event)
      return text
    }, '')
}

module.exports = function (robot) {
  robot.respond(/uoct|taco|tr(aá)nsito/i, function (msg) {
    const send = options => {
      if (['SlackBot', 'Room'].includes(robot.adapter.constructor.name)) {
        robot.adapter.client.web.chat.postMessage(msg.message.room, null, options)
      } else {
        msg.send(options.attachments[0].fallback)
      }
    }

    function sendError (err, message, options) {
      if (err) {
        robot.emit('error', err, msg, 'uoct-golden')
      }
      const text = `Error consultando UOCT: ${message}`
      options.attachments.push({
        fallback: text,
        text,
        title: 'Estado del tránsito'
      })
      send(options)
    }

    const options = {
      as_user: false,
      link_names: 1,
      icon_url: 'https://i.imgur.com/G1cKPWL.png',
      username: 'UOCT RM',
      unfurl_links: false,
      attachments: []
    }

    if (!robot.golden.isGold(msg.message.user.name)) {
      const text =
        'Esta funcionalidad es exclusiva para socios golden :monea: de devsChile. Dona en www.devschile.cl para participar de este selecto grupo :huemul-patitas: .'
      options.attachments.push({
        fallback: text,
        text,
        title: 'Estado del tránsito'
      })
      return send(options)
    }

    const url = 'http://www.uoct.cl/wp/wp-admin/admin-ajax.php'
    const zones = ['sur', 'suroriente', 'surponiente', 'norte', 'nororiente', 'norponiente', 'centro']
    const requests = zones.map(zone => {
      const params = new URLSearchParams(`action=home_incident_zone&zone=zona-${zone}`)
      return fetch(url, { method: 'POST', body: params }).then(res => res.json())
    })

    Promise.all(requests)
      .then((/** @type {Array<Response>} */ responses) => {
        return responses
          .reduce((/** @type {Array<Event>} */ events, event) => {
            return events.concat(event.data)
          }, [])
          .sort((firstEvent, secondEvent) => firstEvent.post_modified < secondEvent.post_modified)
      })
      .then(events => {
        if (events.length === 0) {
          const text = 'Qué raro, parece que está todo normal :thinking_bachelet: . Intenta más tarde.'
          options.attachments.push({
            fallback: text,
            text,
            title: 'Estado del tránsito'
          })
          return send(options)
        }
        const plural = events.length > 1 ? ['s', 's'] : ['', '']
        const fallbackText = parseEvents(events, true)
        const text = parseEvents(events)
        const fallback = `Encontrado${plural[0]} ${events.length} resultado${plural[1]} :bomb::fire:\n${fallbackText}`
        options.attachments.push({
          fallback,
          text,
          title: 'Estado del tránsito'
        })
        send(options)
      })
      .catch(err => {
        sendError(err, 'no se pudo obtener eventos', options)
      })
  })
}
