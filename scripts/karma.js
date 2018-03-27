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
    return Object.keys(users)
      .map(key => users[key])
      .find(user => mentionName === user.mention_name)
  }

  const userFromWeb = token => {
    return robot.adapter.client.web.users.list().then(users => {
      const localUsers = robot.brain.users()
      const user1 = users.members.find(x => x.name === token)
      if (!user1) return
      return localUsers[user1.id]
    })
  }

  const usersForToken = token => {
    return new Promise((resolve, reject) => {
      let user
      if ((user = robot.brain.userForName(token))) {
        return resolve([user])
      }
      if ((user = userForMentionName(token))) {
        return resolve([user])
      }
      if (robot.adapter.constructor.name === 'SlackBot') {
        userFromWeb(token)
          .then(webUser => {
            if (webUser) {
              return resolve([webUser])
            } else {
              return resolve(robot.brain.usersForFuzzyName(token))
            }
          })
          .catch(reject)
      } else {
        user = robot.brain.usersForFuzzyName(token)
        resolve(user)
      }
    })
  }

  const userForToken = (token, response) => {
    return usersForToken(token).then(users => {
      let user
      if (users.length === 1) {
        user = users[0]
      } else if (users.length > 1) {
        robot.messageRoom(
          `@${response.message.user.name}`,
          `Se más específico, hay ${users.length} personas que se parecen a: ${users
            .map(user => user.name)
            .join(', ')}.`
        )
      } else {
        response.send(`Chaucha, no encuentro al usuario '${token}'.`)
      }
      return user
    })
  }

  const canUpvote = (user, victim) => {
    karmaLimits = robot.brain.get('karmaLimits') || {}
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

  const applyKarma = (userToken, op, response) => {
    const thisUser = response.message.user
    userForToken(userToken, response)
      .then(targetUser => {
        if (!targetUser) return
        if (thisUser.name === targetUser.name && op !== '--')
          return response.send('¡Oe no po, el karma es pa otros no pa ti!')
        if (targetUser.length === '') return response.send('¡Oe no seai pillo, escribe un nombre!')
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
          targetName: targetUser.name,
          targetId: targetUser.id,
          date: Date.now(),
          msg: response.envelope.message.text
        })
        robot.brain.set('karmaLog', karmaLog)
        robot.brain.save()
        response.send(`${getCleanName(targetUser.name)} ahora tiene ${getUserKarma(targetUser.id)} puntos de karma.`)
      })
      .catch(err => robot.emit('error', err, response))
  }

  const getUserKarma = userId => {
    const karmaLog = robot.brain.get('karmaLog') || []
    return karmaLog.reduce((prev, curr) => {
      if (curr.targetId === userId) {
        prev += curr.karma
      }
      return prev
    }, 0)
  }

  const removeURLFromTokens = (tokens, message) => {
    const urls = message.match(/\bhttps?:\/\/\S+/gi)
    if (!urls) return tokens
    // if a token match with a URL, it gets remove
    return tokens.filter(token => urls.reduce((acc, url) => acc && url.indexOf(token) === -1, true))
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
      const userToken = token
        .trim()
        .replace(specialChars, '')
        .replace(opRegex, '')
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
        robot.brain.set('karmaLog', [])
        response.send('Todo el mundo ha quedado libre de toda bendición o pecado.')
        robot.brain.save()
      } else {
        userForToken(resetCommand, response).then(targetUser => {
          const karmaLog = robot.brain.get('karmaLog') || []
          const filteredKarmaLog = karmaLog.filter(item => item.targetId !== targetUser.id)
          robot.brain.set('karmaLog', filteredKarmaLog)
          response.send(`${getCleanName(targetUser.name)} ha quedado libre de toda bendición o pecado.`)
          robot.brain.save()
        })
      }
    } else {
      userForToken(targetToken, response).then(targetUser => {
        if (!targetUser) return
        response.send(
          `${getCleanName(targetUser.name)} tiene ${getUserKarma(
            targetUser.id
          )} puntos de karma. Más detalles en: ${hubotWebSite}/karma/log/${targetUser.name}`
        )
      })
    }
  })

  robot.router.get(`/${robot.name}/karma/todos`, (req, res) => {
    const karmaLog = robot.brain.get('karmaLog') || []
    const liKarma = Array.from(
      karmaLog
        // Suma el karma por usuarios
        .reduce((acc, { karma, targetId }) => {
          acc.set(targetId, (acc.get(targetId) || 0) + karma)
          return acc
        }, new Map())
    )
      // Ordena de mayor a menor el karma
      .sort((a, b) => {
        if (a[1] < b[1]) {
          return 1
        } else if (a[1] > b[1]) {
          return -1
        } else {
          return 0
        }
      })
      // Transform el karma a li. Deja fuera a los usuarios con karma 0
      .reduce((acc, [targetId, karma]) => {
        if (karma !== 0) {
          acc += `<li>${karma} <strong>${robot.brain.userForId(targetId).name}</strong></li>`
        }
        return acc
      }, '')
    res.setHeader('content-type', 'text/html')
    res.end(theme('Karma Todos', 'Listado de karma de usuarios devsChile', liKarma))
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
    const processedKarmaLog = filteredKarmaLog.map(log => `${new Date(log.date).toJSON()} - ${log.name}: ${log.msg}`)
    let msg
    if (filteredKarmaLog.length > 0) {
      msg = `<li>${processedKarmaLog.join('</li><li>')}</li>`
    } else {
      msg = `<li>No hay detalles sobre el karma de ${req.params.user}</li>`
    }
    res.setHeader('content-type', 'text/html')
    res.end(theme('Karma Todos', 'Karmalog:', msg))
  })
}
