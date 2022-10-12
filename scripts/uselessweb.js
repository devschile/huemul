// Description:
//   Entrega la url a unn sitio para perder el tiempo
//
// Dependencies:
//   none
//
// Configuration:
//   none
//
// Commands:
//   hubot uselessweb - Returns a random useless web URL.
//
// Author:
//   @victorsanmartin

module.exports = function (robot) {
  robot.respond(/uselessweb/i, function (msg) {
    robot.http('https://gist.githubusercontent.com/quest/07bbc6908f84b50a9fc8/raw/915d538ae98e34a1038f31da54552749fb9d6953/uselessweb.json').get()(function (err, res, body) {
      if (err || res.statusCode !== 200) {
        return robot.emit('error', err || new Error(`Status code ${res.statusCode}`), msg, 'uselessweb')
      }
      var site
      site = JSON.parse(body)
      if (site.uselessweb != null) {
        msg.send(msg.random(site.uselessweb))
      } else {
        msg.send('No hay sitios por hoy')
      }
    })
  })
}
