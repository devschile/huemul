// Description:
//   Send errors to sentry.io
//
// Dependencies:
//   raven
//
// Configuration:
//   SENTRY_DSN, SENTRY_ENVIRONMENT, SENTRY_NAME, SENTRY_CHANNEL
//
// Commands:
//   None

const Raven = require('raven')

module.exports = robot => {
  if (!process.env.SENTRY_DSN) {
    robot.logger.warning('The SENTRY_DSN environment variable not set. Sentry not configured.')
  }

  Raven.config().install()

  robot.error((err, res, scriptName = null) => {
    const prefix = scriptName ? `<${scriptName}>: ` : ''
    robot.logger.error(err)
    if (typeof res !== 'undefined' && res !== null) {
      if (['SlackBot', 'Room'].includes(robot.adapter.constructor.name) && res.message) {
        const context = {
          user: {
            id: res.message.user.id,
            username: res.message.user.name,
            email: res.message.user.email
          },
          script: null
        }
        if (scriptName) context.script = scriptName
        Raven.setContext(context)
      }
    }
    const room = process.env.SENTRY_CHANNEL || '#random'
    robot.send({ room: room }, `${prefix}An error has occurred: \`${err.message}\``)
    Raven.captureException(err)
  })
}
