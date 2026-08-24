// Description:
//   Membresía gold respaldada por soy.devschile.cl
//
// Dependencies:
//   None
//
// Configuration:
//   GOLD_API_URL, GOLD_API_TOKEN, GOLD_SYNC_SECRET, GOLD_CHANNEL
//
// Commands:
//   hubot gold status <name> - Verificar si un usuario posee la membresía gold
//   hubot gold insert <key> - Agregar una gold key para ser un miembro gold
//   hubot gold add <user> [days] - Dar la membresía gold a un usuario
//   hubot gold remove <user> - Quitar la membresía gold a un usuario
//   hubot gold list - Listar todos los miembros gold
//
// Author:
//   @lgaticaq

const crypto = require('crypto')
const fetch = require('node-fetch')
const { WebClient } = require('@slack/web-api')

const PROJECTION_KEY = 'gold_projection'
const POLL_MS = 60000
const TIMEZONE = 'America/Santiago'

const web = new WebClient(process.env.HUBOT_SLACK_TOKEN)

const timingSafeEqualStr = (value, expected) => {
  if (typeof value !== 'string' || typeof expected !== 'string') return false
  const left = Buffer.from(value)
  const right = Buffer.from(expected)
  if (left.length !== right.length) return false
  return crypto.timingSafeEqual(left, right)
}

module.exports = robot => {
  let pollTimer = null

  const apiUrl = () => (process.env.GOLD_API_URL || 'https://soy.devschile.cl').replace(/\/$/, '')

  const authHeaders = () => {
    const token = process.env.GOLD_API_TOKEN
    return token ? { authorization: `Bearer ${token}` } : {}
  }

  const formatDate = value => {
    try {
      return new Intl.DateTimeFormat('en-CA', {
        timeZone: TIMEZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).format(new Date(value))
    } catch (err) {
      return null
    }
  }

  const isActive = member => {
    try {
      return Boolean(member) && new Date(member.paidThrough).getTime() > Date.now()
    } catch (err) {
      return false
    }
  }

  const readProjection = () => {
    const raw = robot.brain.get(PROJECTION_KEY)
    if (!raw) return null
    if (typeof raw === 'string') {
      try {
        return JSON.parse(raw)
      } catch (err) {
        return null
      }
    }
    return raw
  }

  const findMember = name => {
    const projection = readProjection()
    if (!projection || !Array.isArray(projection.members)) return null
    return projection.members.find(member => member && member.handle === name) || null
  }

  class Golden {
    /**
     * Verifica si un determinado usuario es gold
     * @param  {String}  name
     * @return {Boolean}
     */
    isGold (name) {
      try {
        const member = findMember(name)
        return isActive(member)
      } catch (err) {
        return false
      }
    }
  }

  robot.golden = new Golden()

  const normalizeProjection = payload => {
    if (!payload || typeof payload !== 'object' || !Array.isArray(payload.members)) return null
    const members = []
    for (const member of payload.members) {
      const paidThrough = member && (member.paidThrough || member.paid_through)
      if (member && typeof member.handle === 'string' && paidThrough) {
        members.push({ handle: member.handle, paidThrough })
      }
    }
    return {
      version: typeof payload.version === 'number' ? payload.version : 0,
      generatedAt: payload.generatedAt || '',
      members
    }
  }

  const logRefreshError = err => {
    robot.logger.error(`gold: no pude actualizar la proyección de miembros: ${err && err.message}`)
  }

  const refresh = () => {
    return fetch(`${apiUrl()}/api/huemul/projection`, { headers: authHeaders() })
      .then(response => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        return response.json()
      })
      .then(payload => {
        const projection = normalizeProjection(payload)
        if (!projection) throw new Error('payload inválido')
        robot.brain.set(PROJECTION_KEY, projection)
        return projection
      })
  }

  const postJson = (path, body) => {
    return fetch(`${apiUrl()}${path}`, {
      method: 'POST',
      headers: Object.assign({ 'content-type': 'application/json' }, authHeaders()),
      body: JSON.stringify(body)
    }).then(response => {
      return response.json().catch(() => ({})).then(data => {
        if (!response.ok) {
          const err = new Error(`HTTP ${response.status}`)
          err.status = response.status
          err.body = data
          throw err
        }
        return data
      })
    })
  }

  const paidThroughOf = body => {
    if (!body || typeof body !== 'object') return null
    const containers = [body, body.membership]
    for (const container of containers) {
      const value = container && (container.paidThrough || container.paid_through)
      if (value) return value
    }
    return null
  }

  const announceSubscription = (name, paidThrough) => {
    const date = formatDate(paidThrough)
    const until = date ? ` hasta el ${date}` : ''
    const message = `:clap2: *${name}* se suscribió a :huemul:, se lleva un regalito :devschile: y es miembro gold :monea:${until}!`
    web.conversations.list().then(result => {
      const channel = result.channels.find(ch => ch.name === process.env.GOLD_CHANNEL || ch.name === 'random')
      if (channel) robot.send({ room: channel.id }, message)
    }).catch(err => {
      robot.logger.error(`gold: no pude resolver el canal de anuncios: ${err && err.message}`)
    })
  }

  const parseTarget = input => {
    const tokens = String(input || '').trim().split(/\s+/).filter(Boolean)
    if (tokens.length === 0) return null
    const mention = String(tokens[0]).match(/^<@([A-Za-z0-9]+)>$/)
    const days = tokens.length > 1 && /^\d+$/.test(tokens[1]) ? Number(tokens[1]) : undefined
    if (mention) return { slackId: mention[1], days }
    return { handle: tokens[0].replace(/^@/, ''), days }
  }

  const resolveHandle = (res, parsed, fn) => {
    web.users.info({ user: parsed.slackId }).then(result => {
      if (!result.user || !result.user.name) return res.send('No se encontró el usuario')
      fn(result.user.name)
    }).catch(err => {
      robot.logger.error(`gold: no pude resolver el usuario de Slack: ${err && err.message}`)
      res.send('No se encontró el usuario')
    })
  }

  const grantMembership = res => {
    const parsed = parseTarget(res.match[1])
    if (!parsed || (!parsed.handle && !parsed.slackId)) return res.send('No entendí a quién agregar :monea:.')
    const applyGrant = handle => {
      if (!handle) return res.send('No se encontró el usuario')
      const slack = parsed.slackId ? { id: parsed.slackId, handle } : { handle }
      const body = { slack, grantedBy: res.message.user.name, note: 'bot gold add' }
      if (parsed.days) body.days = parsed.days
      postJson('/api/grants', body)
        .then(result => announceSubscription(handle, paidThroughOf(result)))
        .catch(err => {
          robot.logger.error(`gold: falló el grant para ${handle}: ${err && err.message}`)
          res.send(`No pude dar la membresía gold a ${handle} ahora mismo :monea:.`)
        })
    }
    if (parsed.slackId) return resolveHandle(res, parsed, applyGrant)
    applyGrant(parsed.handle)
  }

  const revokeMembership = res => {
    const parsed = parseTarget(res.match[1])
    if (!parsed || (!parsed.handle && !parsed.slackId)) return res.send('No entendí a quién quitar :monea:.')
    const revoke = handle => {
      if (!handle) return res.send('No se encontró el usuario')
      const slack = parsed.slackId ? { id: parsed.slackId, handle } : { handle }
      postJson('/api/grants/revoke', { slack })
        .then(() => res.send(`${handle} ya no es miembro gold :monea:`))
        .catch(err => {
          robot.logger.error(`gold: falló la revocación para ${handle}: ${err && err.message}`)
          res.send(`No pude quitar la membresía gold a ${handle} ahora mismo :monea:`)
        })
    }
    if (parsed.slackId) return resolveHandle(res, parsed, revoke)
    revoke(parsed.handle)
  }

  robot.respond(/gold status (\S+)/i, res => {
    const name = res.match[1].replace(/^@/, '')
    const member = findMember(name)
    if (!member) return res.send(`${name} no es gold :monea:`)
    const date = formatDate(member.paidThrough)
    if (isActive(member)) {
      res.send(`${name} es gold :monea: hasta el ${date}`)
    } else {
      res.send(`${name} ya no es gold :monea:, expiró el ${date}`)
    }
  })

  robot.respond(/gold list\s*$/i, res => {
    const projection = readProjection()
    const members = (projection && Array.isArray(projection.members)) ? projection.members : []
    const names = members.filter(member => isActive(member)).map(member => member.handle)
    if (names.length === 0) return res.send('No hay usuarios gold :monea:')
    res.send(names.join(', '))
  })

  robot.respond(/gold insert (.+)/i, res => {
    const key = res.match[1].trim()
    if (!key) return res.send('No es una clave válida')
    postJson('/api/keys/redeem', {
      key,
      slack: { id: res.message.user.id, handle: res.message.user.name }
    })
      .then(result => {
        refresh().catch(logRefreshError)
        const date = formatDate(paidThroughOf(result))
        res.send(`:clap2: eres miembro gold :monea:${date ? ` hasta el ${date}` : ''}!`)
      })
      .catch(err => {
        const code = err && err.body && err.body.error
        if (code === 'invalid_key') return res.send('No es una clave válida')
        if (code === 'already_redeemed' || (err && err.status === 409)) return res.send('Lo siento, la key ya fue utilizada.')
        robot.logger.error(`gold: falló el canje de la clave: ${err && err.message}`)
        res.send('No pude canjear la clave ahora mismo :monea:, intenta más tarde.')
      })
  })

  robot.respond(/gold add (.+)/i, res => {
    const isAdmin = robot.auth.isAdmin(res.message.user)
    const hasRole = robot.auth.hasRole(res.message.user, 'gold')
    if (!isAdmin && !hasRole) return
    grantMembership(res)
  })

  robot.respond(/gold remove (.+)/i, res => {
    const isAdmin = robot.auth.isAdmin(res.message.user)
    const hasRole = robot.auth.hasRole(res.message.user, 'gold')
    if (!isAdmin && !hasRole) return
    revokeMembership(res)
  })

  robot.router.post('/gold/sync', (req, res) => {
    const secret = process.env.GOLD_SYNC_SECRET
    const header = req.get('authorization') || ''
    if (!secret || !timingSafeEqualStr(header, `Bearer ${secret}`)) {
      return res.status(401).json({ error: 'unauthorized' })
    }
    refresh().catch(logRefreshError)
    res.status(204).end()
  })

  robot.brain.on('loaded', () => {
    if (pollTimer) clearInterval(pollTimer)
    pollTimer = setInterval(() => refresh().catch(logRefreshError), POLL_MS)
    if (typeof pollTimer.unref === 'function') pollTimer.unref()
    refresh().catch(logRefreshError)
  })
}
