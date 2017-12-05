// Description:
//   A simple karma tracking script for hubot.
//
// Commands:
//   karma <name> - shows karma for the named user
//
// Notes
//   <name>++ - adds karma to a user
//   <name>-- - removes karma from a user
//   Adaptado por @clsource Camilo Castro
//   Basado en
//   https://www.npmjs.com/package/hubot-karma
//
// Author
//   @clsource

const theme = require('./theme.js')

module.exports = robot => {
  const hubotHost = process.env.HEROKU_URL || process.env.HUBOT_URL || 'http://localhost:8080'
  const hubotWebSite = `${hubotHost}/${robot.name}`

  const getCleanName = name => `${name[0]}.${name.substr(1)}`

  const userForMentionName = mentionName => {
    const users = robot.brain.users()
    return Object.keys(users).map(key => users[key]).find(user => mentionName === user.mention_name)
  }

  const userFromWeb = token => {
    return robot.adapter.client.web.users.list().then(users => {
      const localUsers = robot.brain.users()
      const user1 = users.members.find(x => x.name === token)
      if (!user1) return
      const user2 = localUsers[user1.id]
      if (typeof user2 === 'undefined' || user2 === null) {
        localUsers[user1.id] = {
          id: user1.id,
          name: user1.name,
          real_name: user1.real_name,
          email_address: user1.profile.email,
          slack: {
            id: user1.id,
            team_id: user1.team_id,
            name: user1.name,
            deleted: user1.deleted,
            status: user1.status,
            color: user1.color,
            real_name: user1.real_name,
            tz: user1.tz,
            tz_label: user1.tz_label,
            tz_offset: user1.tz_offset,
            profile: user1.profile,
            is_admin: user1.is_admin,
            is_owner: user1.is_owner,
            is_primary_owner: user1.is_primary_owner,
            is_restricted: user1.is_restricted,
            is_ultra_restricted: user1.is_ultra_restricted,
            is_bot: user1.is_bot,
            presence: 'active'
          },
          room: 'random',
          karma: 0
        }
        robot.brain.save()
      }
      return localUsers[user1.id]
    })
  }

  const usersForToken = token => {
    return new Promise((resolve, reject) => {
      let user
      if (user = robot.brain.userForName(token)) {
        return resolve([user])
      }
      if (user = userForMentionName(token)) {
        return resolve([user])
      }
      if (robot.adapter.constructor.name === 'SlackBot') {
        userFromWeb(token).then(webUser => {
          if (webUser) {
            return resolve([webUser])
          } else {
            return resolve(robot.brain.usersForFuzzyName(token))
          }
        }).catch(reject)
      } else {
        user = robot.brain.usersForFuzzyName(token)
        resolve(user)
      }
    })
  }

  const userForToken = (token, response) => {
    return usersForToken(token)
      .then(users => {
        let user
        if (users.length === 1) {
          user = users[0]
          if (typeof user.karma === 'undefined' || user.karma === null) {
            user.karma = 0
          }
        } else if (users.length > 1) {
          robot.messageRoom(`@${response.message.user.name}`, `Se más específico, hay ${users.length} personas que se parecen a: ${users.map(user => user.name).join(', ')}.`)
        } else {
          response.send(`Chaucha, no encuentro al usuario '${token}'.`)
        }
        return user
      })
  }

  const canUpvote = (user, victim) => {
    robot.brain.karmaLimits = robot.brain.karmaLimits || {}
    robot.brain.karmaLimits[user.id] = robot.brain.karmaLimits[user.id] || {}
    if (!robot.brain.karmaLimits[user.id][victim.id]) {
      robot.brain.karmaLimits[user.id][victim.id] = new Date()
      robot.brain.save()
      return true
    } else {
      const limit1 = robot.golden.isGold(user.name) ? 15 : 60
      const limit2 = limit1 - 1
      const oldDate = robot.brain.karmaLimits[user.id][victim.id]
      const timePast = Math.round((new Date().getTime() - oldDate.getTime())) / 60000
      if (timePast > limit2) {
        robot.brain.karmaLimits[user.id][victim.id] = new Date()
        robot.brain.save()
        return true
      } else {
        return Math.floor(limit1 - timePast)
      }
    }
  }

  const applyKarma = (userToken, op, response) => {
    const thisUser = response.message.user
    userForToken(userToken, response)
      .then(targetUser => {
        if (!targetUser) return
        if (thisUser.name === targetUser.name && op !== '--') return response.send('¡Oe no po, el karma es pa otros no pa ti!')
        if (targetUser.length === '') return response.send('¡Oe no seai pillo, escribe un nombre!')
        const limit = canUpvote(thisUser, targetUser)
        if (Number.isFinite(limit)) {
          return response.send(`¡No abuses! Intenta en ${limit} minutos.`)
        }
        const modifyingKarma = op === '++' ? 1 : -1
        targetUser.karma += modifyingKarma
        const karmaLog = robot.brain.get('karmaLog') || []
        karmaLog.push({
          name: thisUser.name,
          id: thisUser.id,
          karma: modifyingKarma,
          targetName: targetUser.name,
          targetId: targetUser.id,
          date: Date.now(),
          msg: response.envelope.message.text
        })
        robot.brain.set('karmaLog', karmaLog)
        robot.brain.save()
        response.send(`${getCleanName(targetUser.name)} ahora tiene ${targetUser.karma} puntos de karma.`)
      }).catch(err => robot.emit('error', err, response))
  }

  const removeURLFromTokens = (tokens, message) => {
    const urls = message.match(/\bhttps?:\/\/\S+/gi)
    if (!urls) return tokens
    // if a token match with a URL, it gets remove
    return tokens.filter(token => (
      urls
      .map(url => url.indexOf(token) === -1)
      .reduce((acc, current) => acc && current, true)
    ))
  }

  robot.hear(/([a-zA-Z0-9-_\.]|[^\,\-\s\+$!(){}"'`~%=^:;#°|¡¿?]+?)(\b\+{2}|-{2})([^,]?|\s|$)/g, response => {
    stripRegex = /~!@#$`%^&*()|\=?;:'",<>\{\}/gi
    const tokens = removeURLFromTokens(response.match, response.message.text)
    if (!tokens) return
    if (robot.adapter.constructor.name === 'SlackBot') {
      if (!robot.adapter.client.rtm.dataStore.getChannelGroupOrDMById(response.envelope.room).is_channel) return
    }
    
    tokens.slice(0, 5).forEach(token => {
      const opRegex = /(\+{2}|-{2})/g
      const specialChars = /@/
      const userToken = token.trim().replace(specialChars, '').replace(opRegex, '')
      const op = token.match(opRegex)[0]
      applyKarma(userToken, op, response)
    })
  })

  robot.hear(/^karma(?:\s+@?(.*))?$/, response => {
    if (!response.match[1]) return
    const targetToken = response.match[1].trim()
    if (['todos', 'all'].includes(targetToken.toLowerCase())) {
      response.send(`Karma de todos: ${hubotWebSite}/karma/todos`)
    } else if (targetToken.toLowerCase().split(' ')[0] === 'reset') {
      const thisUser = response.message.user
      if (thisUser.name.toLowerCase() !== 'hector') {
        return response.send('Tienes que ser :hector: para realizar esta función.')
      }
      const resetCommand = targetToken.toLowerCase().split(' ')[1]
      if (!resetCommand) return
      if (['todos', 'all'].includes(resetCommand)) {
        const users = robot.brain.users()
        Object.keys(users).forEach(k => {
          users[k].karma = 0
        })
        response.send('Todo el mundo ha quedado libre de toda bendición o pecado.')
        robot.brain.save()
      } else {
        userForToken(resetCommand, response).then(targetUser => {
          targetUser.karma = 0
          response.send(`${getCleanName(targetUser.name)} ha quedado libre de toda bendición o pecado.`)
          robot.brain.save()
        })
      }
    } else {
      userForToken(targetToken, response).then(targetUser => {
        if (!targetUser) return
        response.send(`${getCleanName(targetUser.name)} tiene ${targetUser.karma} puntos de karma. Más detalles en: ${hubotWebSite}/karma/log/${targetUser.name}`)
      })
    }
  })

  robot.router.get(`/${robot.name}/karma/todos`, (req, res) => {
    const users = robot.brain.users()
    const list = Object.keys(users)
      .sort()
      .filter(id => users[id].karma)
      .map(id => [users[id].karma || 0, `<strong>${users[id].name}</strong>`])
      .sort((line1, line2) => {
        if (line1[0] < line2[0]) {
          return 1
        } else if (line1[0] > line2[0]) {
          return -1
        } else {
          return 0
        }
      })
      .map(line => line.join(' '))
    res.setHeader('content-type', 'text/html')
    res.end(theme('Karma Todos', 'Listado de karma de usuarios devsChile', `<li>${list.join('</li><li>')}</li>`))
  })

  robot.router.get(`/${robot.name}/karma/log`, (req, res) => {
    const karmaLog = robot.brain.get('karmaLog') || []
    const processedKarmaLog = karmaLog.map(line => {
      if (typeof line !== 'string') {
        line = `${line.name} le ha dado ${line.karma} karma a ${line.targetName} - ${new Date(line.date).toJSON()}`
      }
      return line
    })
    res.setHeader('content-type', 'text/html')
    res.end(theme('Karma Todos', 'Karmalog:', `<li>${processedKarmaLog.join('</li><li>')}</li>`))
  })

  robot.router.get(`/${robot.name}/karma/log/:user`, (req, res) => {
    const karmaLog = robot.brain.get('karmaLog') || []
    const filteredKarmaLog = karmaLog.filter(log => {
      if (typeof log !== 'string' && log.msg) {
        return log.targetName === req.params.user
      }
    })
    const processedKarmaLog = filteredKarmaLog.map(log =>
      `${new Date(log.date).toJSON()} - ${log.name}: ${log.msg}`
    )
    let msg
    if (filteredKarmaLog.length > 0) {
      msg = `<li>${processedKarmaLog.join('</li><li>')}</li>`
    } else { msg = `<li>No hay detalles sobre el karma de ${req.params.user}</li>` }
    res.setHeader('content-type', 'text/html')
    // res.end(msg)
    res.end(theme('Karma Todos', 'Karmalog:', msg))
  })
}
