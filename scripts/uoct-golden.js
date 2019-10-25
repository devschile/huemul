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

const moment = require('moment')
const fetch = require('node-fetch')

const LIMITE_DE_EVENTOS = 5

module.exports = function (robot) {
  robot.respond(/uoct|taco|tr(aá)nsito/i, function (msg) {
    function sendError (err, message) {
      if (err) {
        robot.emit('error', err, msg, 'uoct-golden')
      }
      msg.send('Error consultando UOCT: ' + message)
    }

    if (!robot.golden.isGold(msg.message.user.name)) {
      msg.send(
        'Esta funcionalidad es exclusiva para socios golden :monea: de devsChile. Dona en www.devschile.cl para participar de este selecto grupo :huemul-patitas: .'
      )
      return
    }

    msg.send(
      'Buscando qué cagá está en esta ciudad :ql:   :walking: :boom: :car: :boom: :blue_car: :boom: :red_car: :boom:          :police_car:'
    )

    const url = 'http://www.uoct.cl/wp/wp-admin/admin-ajax.php'
    const zones = ['sur', 'suroriente', 'surponiente', 'norte', 'nororiente', 'norponiente', 'centro']
    const requests = zones.map(z => {
      const params = new URLSearchParams(`action=home_incident_zone&zone=zona-${z}`)
      return fetch(url, { method: 'POST', body: params }).then(res => res.json())
    })

    Promise.all(requests)
      .then(responses => {
        return responses.reduce((acc, r) => {
          return acc.concat(r.data)
        }, [])
      })
      .then(events => {
        if (events.length === 0) {
          msg.send('Qué raro, parece que está todo normal :thinking_bachelet: . Intenta más tarde.')
        } else {
          const eventList = events
            .slice(0, LIMITE_DE_EVENTOS)
            .map(e => `${moment(e.post_modified).format('HH:mm')}: ${e.post_title}`)
            .join('\n')

          const plural = events.length > 1 ? ['s', 's'] : ['', '']
          const resume = 'Encontrado' + plural[0] + ' ' + events.length + ' resultado' + plural[1] + ' :bomb::fire:\n'
          const more = events.length > LIMITE_DE_EVENTOS ? '\n<http://www.uoct.cl|Ver más resultados>' : ''
          const text = `${resume}${eventList}${more}`

          msg.send(text)
        }
      })
      .catch(err => {
        sendError(err, 'no se pudo obtener eventos')
      })
  })
}
