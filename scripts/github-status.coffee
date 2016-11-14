# Description:
#   Show current GitHub status and messages
#
# Dependencies:
#   None
#
# Configuration:
#   None
#
# Commands:
#   hubot github status - Returns the last human communication, status, and timestamp.
#   hubot github status last - Returns the current system status and timestamp.
#   hubot github status all - Returns the most recent human communications with status and timestamp.
#
# Author:
#   voke
#
# Modified by:
#   @jorgeepunan

module.exports = (robot) ->
  robot.respond /github status$/i, (msg) ->
    lastMessage msg

  robot.respond /github status resume$/i, (msg) ->
    status msg

  robot.respond /github status all$/i, (msg) ->
    statusMessages msg

# NOTE: messages contains new lines for some reason.
formatString = (string) ->
  decodeURIComponent(string.replace(/(\n)/gm," "))

status = (msg) ->
  msg.http('https://status.github.com/api/status.json')
    .get() (err, res, body) ->
      json = JSON.parse(body)
      now = new Date()
      date = new Date(json['last_updated'])
      secondsAgo = Math.round((now.getTime() - date.getTime()) / 1000)
      msg.send ":octocat: Status: *#{json['status']}* _(#{secondsAgo} seconds ago)_"

lastMessage = (msg) ->
  msg.http('https://status.github.com/api/last-message.json')
    .get() (err, res, body) ->
      json = JSON.parse(body)
      date = new Date(json['created_on'])
      msg.send ":octocat: *[#{json['status']}]* #{formatString(json['body'])} _(#{date.toLocaleString()})_"

statusMessages = (msg) ->
  msg.http('https://status.github.com/api/messages.json')
    .get() (err, res, body) ->
      json = JSON.parse(body)
      buildMessage = (message) ->
        date = new Date(message['created_on'])
        ":octocat: *[#{message['status']}]* #{formatString(message['body'])} _(#{date.toLocaleString()})_"
      msg.send (buildMessage message for message in json).join('\n')
