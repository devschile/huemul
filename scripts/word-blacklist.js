// Description:
//   Word blacklist for all hubot commands
//
// Configuration:
//   HUBOT_BANNED_WORDS = Words to be banned separated by commas (@here,@everywhere)
//
// Commands:
//   hubot ban <username> - Ban username for 5 minutes. Example: hubot ban jaime
//   hubot ban <username> <time>h - Ban username for X minutes. Example: hubot ban jaime 5h
//   hubot ban <username> <time>m - Ban username for X hours. Example: hubot ban jaime 5m
//   hubot unban <username> - Unban username. Example: hubot unban jaime
//   hubot ban-info <username> - Get ban info of a username. Example: hubot ban-info jaime
//
// Author:
//   @gmq
const moment = require('moment')

moment.locale('es')

module.exports = function (robot) {
  const timeouts = robot.brain.get('hubotTimeouts') || {}
  const timeUnitWords = {
    h: 'horas',
    m: 'minutos'
  }

  function getUser (userName) {
    return robot.adapter.client.web.users.list().then(users => users.members.find(x => x.name === userName))
  }

  function isUserPunished (user) {
    if (timeouts[user.id]) {
      const oldDate = timeouts[user.id]
      if (moment().isSameOrAfter(moment(oldDate), 'minutes')) {
        timeouts[user.id] = undefined
        robot.brain.set('hubotTimeouts', timeouts)
        robot.brain.save()
      }
    }

    return timeouts[user.id]
  }

  function punishUser (user, time = 5, timeUnit = 'm') {
    const timeUnitMoment = {
      h: 'hours',
      m: 'minutes'
    }
    timeouts[user.id] = moment()
      .add(time, timeUnitMoment[timeUnit])
      .toDate()
    robot.brain.set('hubotTimeouts', timeouts)
    robot.brain.save()
  }

  function forgiveUser (user) {
    timeouts[user.id] = undefined
    robot.brain.set('hubotTimeouts', timeouts)
    robot.brain.save()
  }

  function isAuthorized (user) {
    const authorizedUsers = process.env.HUBOT_AUTH_ADMIN ? process.env.HUBOT_AUTH_ADMIN.split(',') : []

    return authorizedUsers.indexOf(user.id) !== -1
  }

  // done needed for callback
  robot.listenerMiddleware((context, next, done) => {
    //eslint-disable-line
    if (isAuthorized(context.response.message.user)) {
      next()
    } else if (!isUserPunished(context.response.message.user)) {
      const command = context.response.message.text
      let forbiddenWords = process.env.HUBOT_BANNED_WORDS || ''
      forbiddenWords = forbiddenWords.split(',').filter(word => word !== '')
      for (let i = 0; i < forbiddenWords.length; i++) {
        if (typeof command !== 'undefined' && command !== null) {
          if (command.indexOf(forbiddenWords[i]) !== -1) {
            punishUser(context.response.message.user)

            return robot.messageRoom(
              '#random',
              `${context.response.message.user.name} me quiso maltratar. No lo voy a pescar por 5 minutos.`
            )
          }
        }
      }
      next()
    }
  })

  robot.respond(/ban (\w+)(\s\d+)?(h|m)?/i, res => {
    const userName = res.match[1]
    const time = res.match[2] ? res.match[2].trim() : 5
    const timeUnit = res.match[3] || 'm'

    if (!userName) return

    if (!isAuthorized(res.message.user)) {
      punishUser(res.message.user)

      return robot.messageRoom(
        '#random',
        `${res.message.user.name} me quiso maltratar. No lo voy a pescar por 5 minutos.`
      )
    }

    getUser(userName).then(user => {
      if (user) {
        punishUser(user, time, timeUnit)

        return res.send(`No voy a pescar a ${user.name} por ${time} ${timeUnitWords[timeUnit]}`)
      }
    })
  })

  robot.respond(/unban (\w+)/i, res => {
    if (!isAuthorized(res.message.user)) {
      punishUser(res.message.user)

      return robot.messageRoom(
        '#random',
        `${res.message.user.name} me quiso maltratar. No lo voy a pescar por 5 minutos.`
      )
    }

    getUser(res.match[1]).then(user => {
      if (!user) return
      forgiveUser(user)

      return res.send(`Bueno, bueno, si igual el ${user.name} me cae bien.`)
    })
  })

  robot.respond(/ban-info (\w+)/i, res => {
    getUser(res.match[1]).then(user => {
      if (!user) return
      if (isUserPunished(user)) {
        return res.send(`${user.name} me cae mal hasta ${moment(robot.brain.hubotTimeouts[user.id]).calendar()} `)
      } else {
        return res.send(`${user.name} me cae bien.`)
      }
    })
  })
}
