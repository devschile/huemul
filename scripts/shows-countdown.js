// Description:
//   Search for next airing episode of a given tv show
//
// Dependencies:
//   none
//
// Configuration:
//   None
//
// Commands:
//   hubot countdown help - Show  help
//   hubot countdown <title> - Search for next airing episode of a given tv show
//
// Author:
//   @JoseMCO

module.exports = robot => {
  robot.respond(/countdown(.*)/i, msg => {
    const search = escape(msg.match[1].toLowerCase())
    if (search === '%20help' || search === 'undefined' || !search) {
      msg.send('Tení que darme el nombre de la serie po! (ej: huemul countdown mr robot)\n')
      return false
    }

    // Send request to the tvmaze search API
    robot.http('http://api.tvmaze.com/search/shows?q=' + search).get()((err, res, body) => {
      if (err || res.statusCode !== 200) {
        return robot.emit('error', err || new Error(`Status code ${res.statusCode}`), msg, 'shows-countdown')
      }

      const data = JSON.parse(body)

      if (data.length === 0) {
        msg.send('¿Seguro que ese es el nombre? ¡Tienes que elegir una serie que exista! :retard:')
      } else {
        const showName = data[0].show.name
        const epLink = data[0].show._links.nextepisode

        if (!epLink) {
          msg.send(showName + ' no tiene más fechas! :llora:')
        } else {
          // Send request to the tvmaze episode API
          robot.http(epLink.href).get()((err, res, body) => {
            if (err || res.statusCode !== 200) {
              return robot.emit('error', err || new Error(`Status code ${res.statusCode}`), msg, 'shows-countdown')
            }

            const data = JSON.parse(body)

            if (!data) {
              msg.send('¿Seguro que ese es el nombre? ¡Tienes que elegir una serie que exista! :retard:')
            } else {
              const epName = data.name
              const epDate = data.airstamp
              const epTag = +data.season + 'x' + data.number

              const distance = new Date(epDate) - new Date()
              const _second = 1000
              const _minute = _second * 60
              const _hour = _minute * 60
              const _day = _hour * 24

              const days = Math.floor(distance / _day)
              const hours = Math.floor((distance % _day) / _hour)
              const minutes = Math.floor((distance % _hour) / _minute)
              const seconds = Math.floor((distance % _minute) / _second)
              const count = days + 'd ' + hours + 'h ' + minutes + 'm y ' + seconds + 's :popcorn:'
              const result =
                'El siguiente episodio de ' + showName + ' (' + epTag + ': ' + epName + ') se estrena en ' + count

              msg.send(result)
            }
          })
        }
      }
    })
  })
}
