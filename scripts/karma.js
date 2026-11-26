// Description:
//   A simple karma tracking script for hubot.
//
// Commands:
//   @<username>++|@<username> ++ - adds karma to a user
//   @<username>--|@<username> -- - removes karma from a user
//   hubot karma top [n] - muestra el ranking de karma (10 por defecto, máximo 25)
//   hubot karma @<username> - muestra el karma y el puesto de un usuario
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

  function escapeKarmaName (name) {
    return String(name || '')
      .replace(/[`\r\n]/g, ' ')
      .replace(/^@+/, '')
      .trim()
      .slice(0, 40)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/:\/\//g, ':\u200b//')
  }

  function getKarmaRanking () {
    const karmaLog = robot.brain.get('karmaLog') || []
    const users = new Map()

    karmaLog.forEach(entry => {
      if (!entry || !entry.targetId) return
      const points = Number(entry.karma)
      if (!Number.isFinite(points)) return

      const current = users.get(entry.targetId) || {
        id: entry.targetId,
        name: entry.targetName || entry.targetId,
        score: 0,
        lastVote: 0
      }

      current.score += points
      const voteDate = Number(entry.date) || 0
      if (voteDate >= current.lastVote) {
        current.lastVote = voteDate
        if (entry.targetName) current.name = entry.targetName
      }

      users.set(entry.targetId, current)
    })

    const ranking = [...users.values()].sort((a, b) => {
      return b.score - a.score || String(a.name).localeCompare(String(b.name))
    })

    let previousScore = null
    let previousPosition = 0
    ranking.forEach((user, index) => {
      if (user.score !== previousScore) {
        previousPosition = index + 1
        previousScore = user.score
      }
      user.position = previousPosition
    })

    return ranking
  }

  function findKarmaUser (ranking, id, name) {
    if (id) return ranking.find(user => user.id === id)
    const query = String(name || '').toLowerCase()
    return ranking.find(user => String(user.name).toLowerCase() === query)
  }

  function formatKarmaUser (user, total) {
    const points = Math.abs(user.score) === 1 ? 'punto' : 'puntos'
    return `*${escapeKarmaName(user.name)}* tiene *${user.score}* ${points} de karma (puesto ${user.position} de ${total}).`
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
      const limit1 = robot.golden.isGold(user) ? 15 : 60
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

  robot.respond(/karma(?:\s+(.+))?$/i, res => {
    const arg = (res.match[1] || '').trim()
    const ranking = getKarmaRanking()
    const topMatch = arg.match(/^top(?:\s+(\d+))?$/i)

    if (topMatch) {
      if (ranking.length === 0) {
        return res.send('Todavía no hay karma registrado. Vota con `@usuario++`.')
      }

      const requested = topMatch[1] ? parseInt(topMatch[1], 10) : 10
      const limit = Math.min(Math.max(requested, 1), 25)
      const shown = Math.min(limit, ranking.length)
      const rows = ranking.slice(0, shown).map(user => {
        return `${user.position}. ${escapeKarmaName(user.name)} — ${user.score}`
      })
      const plural = ranking.length === 1 ? 'persona con karma' : 'personas con karma'

      return res.send([`🏆 *Top ${shown} de karma*`, ...rows, '', `_${ranking.length} ${plural}._`].join('\n'))
    }

    if (!arg) {
      return res.send('Uso: `huemul karma top [n]` para el ranking o `huemul karma @usuario` para ver a alguien.')
    }

    const mention = (res.message.mentions || []).find(item => item.type === 'user' || !item.type)
    const query = arg.replace(/^@/, '').trim()
    if (!mention && !/^\S+$/.test(query)) {
      return res.send('Uso: `huemul karma top [n]` para el ranking o `huemul karma @usuario` para ver a alguien.')
    }

    const user = findKarmaUser(ranking, mention && mention.id, query)
    if (!user) {
      const name = mention && mention.info && mention.info.name ? mention.info.name : query
      return res.send(`${escapeKarmaName(name)} no tiene karma todavía.`)
    }

    return res.send(formatKarmaUser(user, ranking.length))
  })

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
