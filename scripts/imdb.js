// Description:
//   Get detailed information about movies or series from IMDb
//
// Dependencies:
//   None
//
// Configuration:
//   None
//
// Commands:
//   hubot movie1serie <title> <year> - Get detailed information about movie or serie from IMDb
//
// Author:
//   @ravenous <hello@ravenous.io>

const apiKey = process.env.THEMOVIEDB_API_KEY

module.exports = robot => {
  if (!apiKey) {
    robot.logger.warning('The THEMOVIEDB_API_KEY environment variable not set.')
  }

  robot.respond(/(movie|serie)\s(.*)/i, msg => {
    const str = msg.match[2]
    const type = msg.match[1]
    let title = str
    let kind = ''

    if (type === 'movie') {
      kind = 'movie'
    } else if (type === 'serie') {
      kind = 'tv'
    }

    if (!apiKey) {
      msg.reply('unset the THEMOVIEDB_API_KEY ' + 'environment variables')
      return
    }

    // Check if there's a year at the end of the string
    if (str.length > 4 && str.match(/\d{4}$/i)) {
      title = str
        .slice(0, -5)
        .split(' ')
        .join('+')
    } else {
      title = str.split(' ').join('+')
    }

    // Send request to the themoviedb API
    robot.http(`https://api.themoviedb.org/3/search/${kind}?api_key=${apiKey}&query=${title}`).get()(
      (err, res, body) => {
        if (err || res.statusCode !== 200) {
          return robot.emit('error', err || new Error(`Status code ${res.statusCode}`), msg, 'imdb')
        }

        const movie = JSON.parse(body)

        if (movie.total_results === 0) {
          msg.send('¿Seguro que ese es el nombre? ¡Tienes que elegir una película o serie! :retard:')
        } else {
          let movieInfo = `Resultados para ${str}: :cabrita:\n`

          movie.results.forEach(function (e) {
            if (kind === 'movie') {
              movieInfo += `- ${e.title} (${e.release_date}): ${e.vote_average} puntos\n`
            } else if (kind === 'tv') {
              movieInfo += `- ${e.name} (${e.first_air_date}): ${e.vote_average} puntos\n`
            }
          })

          msg.send(movieInfo)
        }
      }
    )
  })
}
