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
        return robot.emit('error', err || new Error(`Status code ${res.statusCode}`), msg, 'bitbucket-status')
      }
      try {
        const { page: { updated_at }, status: { description, indicator } } = JSON.parse(body)
        const updatedDate = new Date(updated_at)
        const message = `${description} (Actualizado: ${moment(updatedDate).fromNow()})`
        const colors = new Map([
          ['none', 'good'],
          ['minor', '#FFC400'],
          ['major', '#FF8B00'],
          ['critical', 'danger'],
        ])
        const options = {
          as_user: false,
          link_names: 1,
          icon_url: 'https://i.imgur.com/FedwEBP.jpg',
          username: 'Bitbucket Status',
          unfurl_links: false,
          attachments: [{
            fallback: message,
            text: message,
            color: colors.get(indicator),
          }]
        }
        if (['SlackBot', 'Room'].includes(robot.adapter.constructor.name)) {
          robot.adapter.client.web.chat.postMessage(msg.message.room, null, options)
        } else {
          msg.send(options.attachments[0].fallback)
        }
      } catch (error) {
        robot.emit('error', error, msg, 'bitbucket-status')
      }
    })
  })
}
