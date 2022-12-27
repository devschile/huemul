// Description:
//   A simple karma tracking script for hubot.
//
// Commands:
//   @<username>++|@<username> ++ - adds karma to a user
//   @<username>--|@<username> -- - removes karma from a user
//

const client = require('./helpers/client')
const web = client.getClient()

module.exports = robot => {
  function getCleanName (user) {
    const displayName = user.info.slack && user.info.slack.profile.display_name
    return displayName || user.info.real_name || user.info.name || 'Usuario desconocido'
  }

  function getUserKarma (userId) {
    const karmaLog = robot.brain.get('karmaLog') || []
    return karmaLog.reduce((prev, curr) => {
      if (curr.targetId === userId) {
        prev += curr.karma
      }
      return prev
    }, 0)
  }

  function canUpvote (user, victim) {
    const karmaLimits = robot.brain.get('karmaLimits') || {}
    karmaLimits[user.id] = karmaLimits[user.id] || {}
    if (!karmaLimits[user.id][victim.id]) {
      karmaLimits[user.id][victim.id] = new Date()
      robot.brain.set('karmaLimits', karmaLimits)
      robot.brain.save()
      return true
    } else {
      const limit1 = robot.golden.isGold(user.name) ? 15 : 60
      const limit2 = limit1 - 1
      const oldDate = karmaLimits[user.id][victim.id]
      const timePast = Math.round(new Date().getTime() - oldDate.getTime()) / 60000
      if (timePast > limit2) {
        karmaLimits[user.id][victim.id] = new Date()
        robot.brain.set('karmaLimits', karmaLimits)
        robot.brain.save()
        return true
      } else {
        return Math.floor(limit1 - timePast)
      }
    }
  }

  function applyKarma (userId, op, response) {
    const thisUser = response.message.user
    const targetUser = matchUserIdWithMention(userId, response.message.mentions)

    if (thisUser.id === targetUser.id && op !== '--') {
      return response.send('¡Oe no po, el karma es pa otros no pa ti!')
    }

    const limit = canUpvote(thisUser, targetUser)
    if (Number.isFinite(limit)) {
      return response.send(`¡No abuses! Intenta en ${limit} minutos.`)
    }

    const modifyingKarma = op === '++' ? 1 : -1
    const karmaLog = robot.brain.get('karmaLog') || []
    karmaLog.push({
      name: thisUser.name,
      id: thisUser.id,
      karma: modifyingKarma,
      targetName: getCleanName(targetUser),
      targetId: targetUser.id,
      date: Date.now(),
      msg: response.envelope.message.text
    })
    robot.brain.set('karmaLog', karmaLog)
    robot.brain.save()
    response.send(`${getCleanName(targetUser)} ahora tiene ${getUserKarma(targetUser.id)} puntos de karma.`)
  }

  function matchUserIdWithMention (userId, mentions) {
    return mentions.find(mention => mention.id === userId)
  }

  function cleanUserId (userId) {
    return userId.replace(/<@|>|\+\+|--/g, '')
  }

  const karmaRegex = /<@\w+>\s?(\+\+|--)/gm
  robot.hear(/.+/, res => {
    const matches = res.message.rawText.match(karmaRegex)
    if (matches) {
      web.conversations.info({ channel: res.envelope.room }).then(convInfo => {
        if (convInfo.channel && convInfo.channel.is_channel) {
          const tokens = matches.reduce((acc, match) => {
            const [userId, op] = match.split(/>/)
            acc.push({
              userId: cleanUserId(userId),
              op: op.trim()
            })

            return acc
          }, [])

          tokens.forEach(token => {
            applyKarma(token.userId, token.op, res)
          })
        }
      })
    }
  })
}
