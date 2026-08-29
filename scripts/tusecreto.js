// Description:
//   Tu secreto queda entre tú y :huemul:
//   Dile un secreto a @huemul por DM y este lo anunciará en el canal seleccionado o #random sin mencionarte.
//
// Dependencies:
//   None
//
// Configuration:
//   HUBOT_MYSECRET_ALLOWED_CHANNELS: Lista de canales separados por comas.
//                                    Ej: '#random,#trabajos,#otrocanal'
//
// Commands:
//   hubot mi secreto <secreto> - Envia el secreto al canal #random.
//   hubot mi secreto <canal> <secreto> - Envia el secreto al canal seleccionado.
//
// Author:
//   @jorgeepunan

const { getClient } = require('./helpers/client')

module.exports = robot => {
  const web = getClient()
  robot.respond(/mi secreto (.*)/i, msg => {
    let secreto = msg.match[1]
    let channel = '#random'
    let allowedChannels = process.env.HUBOT_MYSECRET_ALLOWED_CHANNELS || '#random'
    const secretoArr = secreto.split(' ')

    allowedChannels = allowedChannels.split(',')

    if (allowedChannels.indexOf('#' + secretoArr[0]) !== -1 || robot.golden.isGold(msg.message.user)) {
      channel = '#' + secretoArr.shift()
      secreto = secretoArr.join(' ')
    }

    if (secreto.length === 0) {
      return robot.messageRoom(msg.message.user.id, '¿Y el secreto?')
    }

    const forbiddenWords = ['@here', '@channel', '@group', '@everyone']

    for (let i = 0; i < forbiddenWords.length; i++) {
      if (secreto.indexOf(forbiddenWords[i]) !== -1) {
        return robot.messageRoom(msg.message.user.id, 'El tonto de ' + msg.message.user.name + ' trató de usar @')
      }
    }

    web.conversations.list({ types: 'public_channel,private_channel' }).then(res => {
      const slackChannel = res.channels.find(c => c.name === channel.replace(/^#/, ''))

      if (!slackChannel) {
        return robot.messageRoom(msg.message.user.id, 'No sé qué canal es ese.')
      }

      if (!slackChannel.is_member) {
        return robot.messageRoom(msg.message.user.id, 'No estoy en ' + channel + '. :sadhuemul:')
      }

      return robot.messageRoom(slackChannel.id, ':speak_no_evil: *Un secreto:* ' + secreto)
    })
  })
}
