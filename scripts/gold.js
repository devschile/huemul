// Description:
//   Obtener gold con una key válida ó una donación
//
// Dependencies:
//   None
//
// Configuration:
//   GOLD_USER_AGENT, GOLD_SECRET, GOLD_KEYS, GOLD_CHANNEL
//
// Commands:
//   hubot gold status <name> - Verificar si un usuario posee la membresía golden
//   hubot gold insert <key> - Agregar una golden key para ser un miembro golden
//   hubot gold add <user> - Dar la membresía golden a un usuario
//   hubot gold remove <user> - Quitar la membresía golden a un usuario
//   hubot gold list - Listar todos los miembros golden

module.exports = robot => {
  /**
   * Obtener listado de usuarios golden
   * @return {Array}
   */
  const getGoldUsers = () => {
    const goldUsers = JSON.parse(robot.brain.get('gold_users') || '{}')
    return Object.keys(goldUsers)
      .map(key => ({key: key, data: goldUsers[key]}))
  }

  /**
   * Buscar un usuario golden
   * @param  {String} name
   * @return {Object}      En caso de encontrar el usuario retorna un Object, caso contrario null
   */
  const getGoldUser = name => getGoldUsers().find(result => result.data.user === name)

  /**
   * Verifica la expiración de un usuario golden.
   * En caso de expirar actualiza el robot.brain
   * @param  {String} key  Key del store del usuario en el brain
   * @param  {Object} data El Object usuario
   * @return {Object}      Retorna el estado de expiración y la fecha en formato YYYY-MM-DD
   */
  const verifyExpireGold = (key, data) => {
    const goldUsers = JSON.parse(robot.brain.get('gold_users') || '{}')
    const now = new Date()
    const expireDate = new Date(data.expire)
    const expire = expireDate.toISOString().split('T').shift()
    if (now <= expireDate) {
      return {expired: false, date: expire}
    } else {
      delete goldUsers[key]
      robot.brain.set('gold_users', JSON.stringify(goldUsers))
      return {expired: true, date: expire}
    }
  }

  /**
   * Agrega un usuario al store de golden
   * @param  {String} name
   * @return {Void}
   */
  const addUser = name => {
    const goldUsers = JSON.parse(robot.brain.get('gold_users') || '{}')
    const now = new Date()
    const diff = 1000 * 60 * 60 * 24 * 60 // 60 días
    if(goldUsers[name]){
     const expire = new Date(goldUsers[name].expire.getTime() + diff)
    }else{
      const expire = new Date(now.getTime() + diff)
    }
    goldUsers[name] = {user: name, expire: expire}
    robot.brain.set('gold_users', JSON.stringify(goldUsers))
    const channel = robot.adapter.client.rtm.dataStore.getChannelByName(process.env.GOLD_CHANNEL || '#random')
    const message = `:clap2: *${name}* donó 1 mes de servidor a :huemul:, se lleva 3 stickers :huemul: y es miembro golden :monea: por 2 meses!`
    robot.send({room: channel.id}, message)
  }

  class Golden {
    /**
     * Verifica si un determinado usuario es golden
     * @param  {String}  name
     * @return {Boolean}
     */
    isGold (name) {
      const result = getGoldUser(name)
      if (result) {
        return !verifyExpireGold(result.key, result.data).expired
      }
      return false
    }
  }

  robot.golden = new Golden()

  robot.respond(/gold status (.*)/i, res => {
    const name = res.match[1]
    const result = getGoldUser(name)
    if (!result) return res.send(`${name} no es golden :monea:`)
    const data = verifyExpireGold(result.key, result.data)
    if (!data.expired) {
      res.send(`${name} es golden :monea: hasta el ${data.date}`)
    } else {
      res.send(`${name} ya no eres golden :monea:, expiró el ${data.date}`)
    }
  })

  robot.respond(/gold list/i, res => {
    const users = getGoldUsers()
      .filter(result => !verifyExpireGold(result.key, result.data).expired)
      .map(result => result.data.user).join(', ')
    if (users === '') {
      res.send('No hay usuarios golden :monea:')
    } else {
      res.send(users)
    }
  })

  robot.respond(/gold insert (.*)/i, res => {
    const key = res.match[1]
    const keys = (process.env.GOLD_KEYS || '').split(',')
    const goldUsers = JSON.parse(robot.brain.get('gold_users') || '{}')
    if (key in goldUsers) {
      res.send('Lo siento, la key ya fue utilizada.')
    } else if (keys.includes(key)) {
      const now = new Date()
      const diff = 1000 * 60 * 60 * 24 * 30 // 30 días
      if(goldUsers[key]){
       const expire = new Date(goldUsers[key].expire.getTime() + diff)
      }else{
        const expire = new Date(now.getTime() + diff)
      }
      const expire = new Date(now.getTime() + diff)
      goldUsers[key] = {user: res.message.user.name, expire: expire}
      robot.brain.set('gold_users', JSON.stringify(goldUsers))
      res.send('*¡Felicitaciones!* ya eres golden :monea: :wink: :yeah:')
    } else {
      res.send('No es una clave válida')
    }
  })

  robot.respond(/gold add (.*)/i, res => {
    const isAdmin = robot.auth.isAdmin(res.message.user)
    const hasRole = robot.auth.hasRole(res.message.user, 'gold')
    if (isAdmin || hasRole) {
      const user = robot.adapter.client.rtm.dataStore.getUserByName(res.match[1])
      if (typeof user !== 'undefined') {
        addUser(user.name)
      } else {
        res.reply('el usuario no existe')
      }
    }
  })

  robot.respond(/gold remove (.*)/i, res => {
    const isAdmin = robot.auth.isAdmin(res.message.user)
    const hasRole = robot.auth.hasRole(res.message.user, 'gold')
    if (isAdmin || hasRole) {
      const user = res.match[1]
      const goldUsers = JSON.parse(robot.brain.get('gold_users') || '{}')
      if (Object.keys(goldUsers).includes(user)) {
        delete goldUsers[user]
        robot.brain.set('gold_users', JSON.stringify(goldUsers))
        res.send(`${user} ya no es miembro golden :monea:`)
      } else {
        res.reply('el usuario no existe')
      }
    }
  })

  robot.router.post('/gold/webhook', (req, res) => {
    if (req.get('User-Agent') === process.env.GOLD_USER_AGENT && req.body.secret === process.env.GOLD_SECRET) {
      const user = robot.adapter.client.rtm.dataStore.getUserByEmail(req.body.email)
      if (typeof user !== 'undefined') {
        addUser(user.name)
      } else {
        const admins = process.env.HUBOT_AUTH_ADMIN
        if (admins) {
          let message = `El email ${req.body.email} acaba de donar pero no `
          message += 'logré determinar qué usuario es para agregarlo a los '
          message += 'golden :monea:.\nEste mensaje fue enviado a todos los '
          message += 'administradores de DevsChile.'
          admins.split(',').forEach(admin => {
            robot.send({room: admin}, message)
          })
        }
      }
      res.send('Ok')
    } else {
      robot.emit('error', `Se envió un request inválido con el siguiente email: ${req.body.email}`)
      res.send('Error')
    }
  })
}
