// Description:
//   A simple karma tracking script for hubot.
//
// Commands:
//   <username>++ - adds karma to a user
//   <username>-- - removes karma from a user
//   karma <username> - shows karma for the named user
//   karma all - shows karma for all users
//   karma todos - shows karma for all users
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
const exceptions = ['c', 'C']
module.exports = robot => {
  const hubotHost = process.env.HEROKU_URL || process.env.HUBOT_URL || 'http://localhost:8080'
  const hubotWebSite = `${hubotHost}/${robot.name}`

  const getCleanName = user => user.profile.display_name_normalized || user.real_name || 'Usuario desconocido'

  const usersForToken = token => {
    return getUsers().then(userList => userFromList(userList, token))
  }

  const getUsers = () => {
    const userListCache = robot.brain.get('userListCache') || {}
    const cacheLimit = 15
    let checkCache = true
    if (userListCache.updateDate) {
      const timeSinceUpdate = Math.round(new Date().getTime() - userListCache.updateDate.getTime()) / 60000
      checkCache = timeSinceUpdate > cacheLimit
    }

    if (checkCache) {
      return updateUsersCache()
    } else {
      return new Promise((resolve, reject) => resolve(userListCache.members))
    }
  }

  const updateUsersCache = () => {
    const paginatedGetUsers = cursor => {
      const limit = 900
      const params = { limit }
      if (cursor) {
        params.cursor = cursor
      }

      return robot.adapter.client.web.users.list(params).then(userList => {
        if (userList && userList.response_metadata && userList.response_metadata.next_cursor) {
          return paginatedGetUsers(userList.response_metadata.next_cursor).then(newUserList => {
            userList.members = userList.members.concat(newUserList.members)

            return userList
          })
        } else {
          return userList
        }
      })
    }

    return paginatedGetUsers().then(userList => {
      userList.updateDate = new Date()
      robot.brain.set('userListCache', userList)

      return userList.members
    })
  }

  const userFromList = (userList, token) => {
    if (token.indexOf('<') === 0 && token.indexOf('>') === token.length - 1) {
      return userList.filter(user => user.id === token.replace(/[><]/g, ''))
    }

    return userList.filter(
      user =>
        !user.deleted &&
        getCleanName(user)
          .toLowerCase()
          .indexOf(token) === 0
    )
  }

  const userForToken = (token, response) => {
    return usersForToken(token).then(users => {
      let user
      if (users.length === 1) {
        user = users[0]
      } else if (users.length > 1) {
        const room = robot.adapter.client.rtm.dataStore.getDMByName(response.message.user.name)
        robot.send(
          { room: room.id },
          `Se más específico, hay ${users.length} personas que se parecen a: ${users
            .map(user => getCleanName(user))
            .join(', ')}.`
        )
      } else {
        response.send(`Chaucha, no encuentro al usuario '${token}'.`)
      }
      return user
    })
  }

  const canUpvote = (user, victim) => {
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

  const applyKarma = (userToken, op, response) => {
    if (exceptions.indexOf(userToken) < 0) {
      const thisUser = response.message.user
      userForToken(userToken, response)
        .then(targetUser => {
          if (!targetUser) return
          if (thisUser.id === targetUser.id && op !== '--') {
            return response.send('¡Oe no po, el karma es pa otros no pa ti!')
          }
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
            targetName: getCleanName(targetUser),
            targetId: targetUser.id,
            date: Date.now(),
            msg: response.envelope.message.text
          })
          robot.brain.set('karmaLog', karmaLog)
          robot.brain.save()
          response.send(`${getCleanName(targetUser)} ahora tiene ${getUserKarma(targetUser.id)} puntos de karma.`)
        })
        .catch(err => robot.emit('error', err, response, 'karma'))
    }
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

  const karmaRegex = /([a-zA-Z0-9-_.]|[^,\-\s+$!(){}"'`~%=^:;#°|¡¿?]+?)(\+{2}|-{2})([^,]?|\s|$)/g

  robot.hear(karmaRegex, response => {
    const textToCheck = response.message.rawText || response.message.text
    const reFilteredMatch = textToCheck.match(karmaRegex)
    const tokens = removeURLFromTokens(reFilteredMatch, response.message.text)

    if (!tokens) return
    if (robot.adapter.constructor.name === 'SlackBot') {
      if (!robot.adapter.client.rtm.dataStore.getChannelGroupOrDMById(response.envelope.room).is_channel) return
    }

    tokens
      .slice(0, 5)
      .map(token => {
        const opRegex = /(\+{2}|-{2})/g
        const specialChars = /@/

        return {
          userToken: token
            .trim()
            .replace(specialChars, '')
            .replace(opRegex, ''),
          op: token.match(opRegex)[0]
        }
      })
      .filter(karma => karma.userToken && karma.userToken !== '')
      .forEach(karma => {
        applyKarma(karma.userToken, karma.op, response)
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
          response.send(`${getCleanName(targetUser)} ha quedado libre de toda bendición o pecado.`)
          robot.brain.save()
        })
      }
    } else {
      userForToken(targetToken, response).then(targetUser => {
        if (!targetUser) return
        response.send(
          `${getCleanName(targetUser)} tiene ${getUserKarma(
            targetUser.id
          )} puntos de karma. Más detalles en: ${hubotWebSite}/karma/log/${targetUser.id}`
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
          acc += `<li><strong>${robot.brain.userForId(targetId).name}</strong>: ${karma}</li>`
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
        return log.id === req.params.user
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
