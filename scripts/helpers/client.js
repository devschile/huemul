const { WebClient } = require('@slack/web-api')

exports.getClient = () => {
  const token = process.env.HUBOT_SLACK_TOKEN
  const web = new WebClient(token)

  return web
}
