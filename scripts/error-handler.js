// Description:
//   Send errors to sentry.io
//
// Dependencies:
//   @sentry/node
//
// Configuration:
//   SENTRY_DSN, SENTRY_ENVIRONMENT, SENTRY_NAME, SENTRY_CHANNEL
//
// Commands:
//   None
//
// Author:
//   @lgaticaq

const Sentry = require('@sentry/node')

module.exports = robot => {
  const sentryDsn = process.env.SENTRY_DSN
  if (!sentryDsn) {
    robot.logger.warning('The SENTRY_DSN environment variable not set. Sentry not configured.')
  } else {
    Sentry.init({
      dsn: sentryDsn,
      environment: process.env.SENTRY_ENVIRONMENT,
      serverName: process.env.SENTRY_NAME
    })
  }

  robot.error((err, res, scriptName = null) => {
    const prefix = scriptName ? `<${scriptName}>: ` : ''
    robot.logger.error(err)
    const room = process.env.SENTRY_CHANNEL || '#huemul-devs'
    const fileName = err && err.stack ? err.stack.split(' at')[1] || 'unknown' : 'unknown'

    robot.send({ room: room }, `
      script name: ${fileName}
      ${prefix}An error has occurred: \`${err.message}\`
    `)

    if (!sentryDsn) return

    Sentry.withScope(scope => {
      if (typeof res !== 'undefined' && res !== null) {
        if (['SlackBot', 'Room'].includes(robot.adapter.constructor.name) && res.message) {
          scope.setUser({
            id: res.message.user.id,
            username: res.message.user.name,
            email: res.message.user.email
          })
        }
      }

      if (scriptName) scope.setTag('script', scriptName)

      Sentry.captureException(err)
    })
  })
}
