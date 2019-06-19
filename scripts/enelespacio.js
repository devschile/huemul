// Description:
//   Muestra quiénes están en el espacio (fuera de la tierra) AHORA
//
// Dependencies:
//   http://api.open-notify.org/
//
// Configuration:
//   None
//
// Commands:
//   hubot en el espacio - Muestra quiénes están en el espacio (fuera de la tierra) AHORA
//
// Author:
//   @jorgeepunan

const url = 'http://api.open-notify.org/astros.json'

const emojis = [':space_invader:', ':stars:', ':alien:', ':star2:']

module.exports = function(robot) {
  robot.respond(/en el espacio/i, res => {
    robot.http(url).get()((error, response, body) => {
      if (!error && response.statusCode === 200) {
        try {
          const data = JSON.parse(body)
          const cuantos = data.number
          const messages = []

          messages.push(`En este momento hay *${cuantos}* personas en el espacio ${res.random(emojis)}`)

          data.people.forEach(d => {
            const donde = d.craft
            const quien = d.name

            messages.push(` · ${quien} (${donde})`)
          })

          res.send(messages.join('\n'))
        } catch (err) {
          robot.emit('error', err, res, 'en el espacio')
        }
      } else {
        res.send(':facepalm: Error: ', error)
      }
    })
  })
}
