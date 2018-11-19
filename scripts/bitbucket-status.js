// Description:
//   Show current Bitbucket status and messages
//
// Dependencies:
//   None
//
// Configuration:
//   None
//
// Commands:
//   hubot bitbucket status - Returns the status and timestamp for the last update
//
// Author:
//   @raerpo

const moment = require('moment')

module.exports = robot => {
  robot.respond(/bitbucket status$/i, msg => {
    robot.http('https://bqlf8qjztdtr.statuspage.io/api/v2/status.json').get()((err, res, body) => {
      if (err || res.statusCode !== 200) {
        return robot.emit('error', err || new Error(`Status code ${res.statusCode}`), msg)
      }
      try {
        const { page: { updated_at }, status: { description } } = JSON.parse(body)
        const updatedDate = new Date(updated_at)
        msg.send(`:bitbucket: ${description} (Actualizado: ${moment(updatedDate).fromNow()})`)
      } catch (error) {
        const errorMessage = 'Bitbucket status api failed to be parse'
        return robot.emit('error', new Error(errorMessage), errorMessage)
      }
    })
  })
}
