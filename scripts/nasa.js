// Description:
//   Muestra la foto del día entregada por la NASA
//
// Dependencies:
//   https://api.nasa.gov/
//
// Configuration:
//   None
//
// Commands:
//   hubot foto del d[ií]a - Muestra la foto del día entregada por la NASA
//
// Author:
//   @jorgeepunan

const url = 'https://api.nasa.gov/planetary/apod'
const apikey = 'fCSASHvV7aQWommjx56XrfPwijEpHPeDkbHIPySi'

module.exports = function (robot) {
  robot.respond(/foto del d[ií]a/i, function (res) {
    const fullURL = `${url}?api_key=${apikey}`

    robot.http(fullURL).get()(function (error, response, body) {
      if (!error && response.statusCode === 200) {
        const data = JSON.parse(body)

        res.send(data.url)
        res.send(`*${data.title}* by _${data.copyright} (${data.date})_`)
        res.send(`> ${data.explanation}`)
      } else {
        res.send(':facepalm: Error: ', error)
      }
    })
  })
}
