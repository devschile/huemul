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
//   hubot foto del dia - Muestra la foto del día entregada por la NASA
//   hubot foto del día - Muestra la foto del día entregada por la NASA
//
// Author:
//   @jorgeepunan

var url = 'https://api.nasa.gov/planetary/apod'
var apikey = 'fCSASHvV7aQWommjx56XrfPwijEpHPeDkbHIPySi'

function currentDate () {
  var today = new Date()
  var dd = today.getDate()
  var mm = today.getMonth() + 1
  var yyyy = today.getFullYear()

  if (dd < 10) {
    dd = '0' + dd
  }
  if (mm < 10) {
    mm = '0' + mm
  }
  return yyyy + '-' + mm + '-' + dd
}

module.exports = function (robot) {
  robot.respond(/foto del d[ií]a/i, function (res) {
    var fullURL = url + '?api_key=' + apikey

    robot.http(fullURL).get()(function (error, response, body) {
      if (!error && response.statusCode === 200) {
        var data = JSON.parse(body)

        res.send(data.title + ' [' + currentDate() + ']')
        res.send(data.url)
      } else {
        res.send(':facepalm: Error: ', error)
      }
    })
  })
}
