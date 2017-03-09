# Description:
#   A simple karma tracking script for hubot.
#
# Commands:
#   karma <name> - shows karma for the named user
#
# Notes
#   <name>++ - adds karma to a user
#   <name>-- - removes karma from a user
#   Adaptado por @clsource Camilo Castro
#   Basado en
#   https://www.npmjs.com/package/hubot-karma
#
# Author
#   @clsource

module.exports = (robot) ->
  hubotHost = process.env.HEROKU_URL or process.env.HUBOT_URL or "http://localhost:8080"
  hubotWebSite = "#{hubotHost}/#{robot.name}"

  robot.hear /@?((?=[^\+\-_])[a-zA-Z0-9-_]+|[^-\s\+]+)(\b\+{2}|-{2})(\s|$)/g, (response) ->
    tokens = response.match
    return if not tokens
    return if not robot.adapter.client.rtm.dataStore.getChannelGroupOrDMById(response.envelope.room).is_channel
    tokens = tokens.slice(0, 5);

    for token in tokens
      opRegex = /\+{2}|-{2}/g;
      userToken = token.trim().replace(opRegex,'')
      op = token.match(opRegex)[0]
      applyKarma(userToken, op, response)

  robot.hear /^karma(?:\s+@?(.*))?$/, (response) ->
    targetToken = response.match[1]?.trim()
    return if not targetToken
    if targetToken.toLowerCase() in ["todos", "all"]
      msg = "Karma de todos: #{hubotWebSite}/karma/todos"
      response.send msg
    else if targetToken.toLowerCase().split(' ')[0] == 'reset'
      thisUser = response.message.user
      if thisUser.name.toLowerCase() != "hector"
        response.send "Tienes que ser :hector: para realizar esta función"
        return
      resetCommand = targetToken.toLowerCase().split(' ')[1]
      return if not resetCommand
      if resetCommand in ["todos", "all"]
        users = robot.brain.users()
        list = Object.keys(users)
          .map((k) -> users[k].karma = 0)
        msg = "Todo el mundo ha quedado libre de toda bendición o pecado."
        response.send msg
        robot.brain.save()
      else
        userForToken(resetCommand, response).then (targetUser) ->
          targetUser.karma = 0
          msg = "#{getCleanName(targetUser.name)} ha quedado libre de toda bendición o pecado."
          response.send msg
          robot.brain.save()
    else
      userForToken(targetToken, response).then (targetUser) ->
        return if not targetUser
        msg = "#{getCleanName(targetUser.name)} tiene #{targetUser.karma} puntos de karma.
              Más detalles en: #{hubotWebSite}/karma/log/#{targetUser.name}"
        response.send msg

  robot.router.get "/#{robot.name}/karma/todos", (req, res) ->
    users = robot.brain.users()
    list = Object.keys(users)
      .sort()
      .filter((k) -> users[k].karma)
      .map((k) -> [users[k].karma or 0, "<strong>#{users[k].name}</strong>"])
      .sort((line1, line2) -> if line1[0] < line2[0] then 1 else if line1[0] > line2[0] then -1 else 0)
      .map((line) -> line.join " ")
    msg = "Karma de todos:\n
          <ul>
          <li>#{list.join '</li><li>'}</li>
          </ul>"
    res.setHeader 'content-type', 'text/html'
    res.end msg

  robot.router.get "/#{robot.name}/karma/log", (req, res) ->
    karmaLog = robot.brain.get('karmaLog') or []
    processedKarmaLog = karmaLog.map (line) ->
                          if typeof line != 'string'
                            line = "#{line.name} le ha dado #{line.karma} karma a #{line.targetName} - #{new Date(line.date).toJSON()}"
                          return line
    msg = "Karmalog:\n
          <ul>
          <li>#{processedKarmaLog.join '</li><li>'}</li>
          </ul>"
    res.setHeader 'content-type', 'text/html'
    res.end msg

  robot.router.get "/#{robot.name}/karma/log/:user", (req, res) ->
    karmaLog = robot.brain.get('karmaLog') or []
    filteredKarmaLog = karmaLog.filter (log) ->
                          if typeof log != 'string' && log.msg
                            return log.targetName == req.params.user
    processedKarmaLog = filteredKarmaLog.map (log) ->
                          return "#{new Date(log.date).toJSON()} - #{log.name}: #{log.msg}"
    if filteredKarmaLog.length > 0
      msg = "Karmalog:
            <ul>
              <li>#{processedKarmaLog.join '</li><li>'}</li>
            </ul>"
    else
      msg = "No hay detalles sobre el karma de #{req.params.user}"
    res.setHeader 'content-type', 'text/html'
    res.end msg

  applyKarma = (userToken, op, response) ->
    thisUser = response.message.user
    userForToken(userToken, response)
      .then (targetUser) ->
        return if not targetUser
        return response.send "Oe no po, el karma es pa otros no pa ti!" if thisUser.name is targetUser.name
        return response.send "Oe no seai pillo, escribe un nombre!" if targetUser.length is ''
        limit = canUpvote(thisUser, targetUser)
        if Number.isFinite(limit)
          response.send "¡No abuses! Intenta en " + limit + " minutos"
          return
        modifyingKarma = if op is "++" then 1 else -1
        targetUser.karma += modifyingKarma
        karmaLog = robot.brain.get('karmaLog') or []
        karmaLog.push({
          name: thisUser.name,
          id: thisUser.id,
          karma: modifyingKarma,
          targetName: targetUser.name,
          targetId: targetUser.id,
          date: Date.now(),
          msg: response.envelope.message.text
        })
        robot.brain.set 'karmaLog', karmaLog
        robot.brain.save()
        response.send "#{getCleanName(targetUser.name)} ahora tiene #{targetUser.karma} puntos de karma."
    .catch (err) ->
      console.log(err)

  userForToken = (token, response) ->
    return usersForToken(token)
      .then (users) ->
        if users.length is 1
          user = users[0]
          user.karma ?= 0
        else if users.length > 1
          robot.messageRoom "@#{response.message.user.name}", "Se más específico, Hay #{users.length} personas que se parecen a: #{(getCleanName(u.name) for u in users).join ", "}."
        else
          response.send "Chaucha, no encuentro al usuario '#{token}'."
        user

  usersForToken = (token) ->
    userPromise = new Promise((resolve, reject) ->
      if user = robot.brain.userForName(token)
        return resolve([user])
      if user = userForMentionName(token)
        return resolve([user])
      userFromWeb(token).then (webUser) ->
        if webUser
          return resolve [webUser] if webUser
        else
          user = robot.brain.usersForFuzzyName(token)
          return resolve(user)
    )
    return userPromise

  userForMentionName = (mentionName) ->
    for id, user of robot.brain.users()
      return user if mentionName is user.mention_name

  canUpvote = (user, victim) ->
    robot.brain.karmaLimits ?= {}
    robot.brain.karmaLimits[user.id] ?= {}
    if not robot.brain.karmaLimits[user.id][victim.id]
      robot.brain.karmaLimits[user.id][victim.id] = new Date()
      robot.brain.save()
      return true
    else
      oldDate = robot.brain.karmaLimits[user.id][victim.id]
      timePast = Math.round((new Date().getTime() - oldDate.getTime())) / 60000
      if timePast > 59
        robot.brain.karmaLimits[user.id][victim.id] = new Date()
        robot.brain.save()
        return true
      else
        return Math.floor(60 - timePast)

  getCleanName = (name) ->
    return name[0] + '.' + name.substr(1)

  userFromWeb = (token) ->
    return robot.adapter.client.web.users.list().then (users) ->
      localUsers = robot.brain.users()
      user1 = users.members.find (x) -> x.name is token
      return unless user1
      user2 = localUsers[user1.id]
      unless user2?
        localUsers[user1.id] =
          id: user1.id
          name: user1.name
          real_name: user1.real_name
          email_address: user1.profile.email
          slack:
            id: user1.id
            team_id: user1.team_id
            name: user1.name
            deleted: user1.deleted
            status: user1.status
            color: user1.color
            real_name: user1.real_name
            tz: user1.tz
            tz_label: user1.tz_label
            tz_offset: user1.tz_offset
            profile: user1.profile
            is_admin: user1.is_admin
            is_owner: user1.is_owner
            is_primary_owner: user1.is_primary_owner
            is_restricted: user1.is_restricted
            is_ultra_restricted: user1.is_ultra_restricted
            is_bot: user1.is_bot
            presence: "active"
          room: "random"
          karma: 0
        robot.brain.save()
      localUsers[user1.id]
