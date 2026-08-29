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
//   hubot gold status <name> - Verificar si un usuario posee la membresía gold (de terceros: admin o rol gold)
//   hubot gold insert <key> - Agregar una gold key para ser un miembro gold
//   hubot gold add <user> [days] - Dar la membresía gold a un usuario (admin o rol gold)
//   hubot gold remove <user> - Quitar la membresía gold a un usuario (admin o rol gold)
//   hubot gold link <code> - Vincular tu cuenta de devsChile con Slack
//   hubot gold list - Listar todos los miembros gold (admin o rol gold)
//
// Author:
//   @lgaticaq

const crypto = require('crypto')
const fetch = require('node-fetch')
const { WebClient } = require('@slack/web-api')

const PROJECTION_KEY = 'gold_projection'
const SLACK_HANDLE_CACHE_KEY = 'gold_slack_handles'
const POLL_MS = 60000
const SLACK_HANDLE_CACHE_TTL_MS = 24 * 60 * 60 * 1000
const TIMEZONE = 'America/Santiago'

const web = new WebClient(process.env.HUBOT_SLACK_TOKEN)

const timingSafeEqualStr = (value, expected) => {
  if (typeof value !== 'string' || typeof expected !== 'string') return false
  const left = Buffer.from(value)
  const right = Buffer.from(expected)
  if (left.length !== right.length) return false
  return crypto.timingSafeEqual(left, right)
}

const FETCH_TIMEOUT_MS = 10000

const fetchWithTimeout = (url, options, parseBody) => {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  return fetch(url, Object.assign({}, options, { signal: controller.signal }))
    .then(async response => ({ response, data: await parseBody(response) }))
    .finally(() => clearTimeout(timer))
}

module.exports = robot => {
  let pollTimer = null
  let syncRefresh = null

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

  const sameMembers = (a, b) => {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false
    // Both sides come from normalizeProjection, and the master sorts by handle,
    // so a positional comparison is enough.
    return a.every((member, i) =>
      member.slackId === b[i].slackId &&
      member.handle === b[i].handle &&
      member.paidThrough === b[i].paidThrough)
  }

  const findMember = target => {
    const projection = readProjection()
    if (!projection || !Array.isArray(projection.members)) return null
    const identity = typeof target === 'string' ? { handle: target } : target
    const slackId = identity && identity.slackId
    const handle = identity && identity.handle
    if (slackId) {
      return projection.members.find(member => member && member.slackId === slackId) || null
    }
    return (handle && projection.members.find(member => member && member.handle === handle)) || null
  }

  class Golden {
    isGold (user) {
      try {
        const slackId = user && typeof user === 'object' && user.id
        if (!slackId) return false
        const member = findMember({ slackId })
        return isActive(member)
      } catch (err) {
        return false
      }
    }
  }

  robot.golden = new Golden()

  const NOT_ALLOWED = 'Necesitas ser admin o tener el rol `gold` :monea: para usar este comando.'

  const canManageGold = user => {
    const auth = robot.auth
    if (!auth) return false
    return Boolean(auth.isAdmin(user) || auth.hasRole(user, 'gold'))
  }

  const normalizeProjection = payload => {
    if (!payload || typeof payload !== 'object' || !Array.isArray(payload.members)) return null
    const members = []
    for (const member of payload.members) {
      const paidThrough = member && (member.paidThrough || member.paid_through)
      if (member && typeof member.handle === 'string' && paidThrough) {
        const slackId = member.slackId || member.slack_id
        if (typeof slackId !== 'string' || !slackId) continue
        members.push({ slackId, handle: member.handle, paidThrough })
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
    return fetchWithTimeout(`${apiUrl()}/api/huemul/projection`, { headers: authHeaders() }, async response => {
      if (!response.ok) {
        await response.text().catch(() => '')
        throw new Error(`HTTP ${response.status}`)
      }
      return response.json()
    })
      .then(({ data }) => {
        const projection = normalizeProjection(data)
        if (!projection) throw new Error('payload inválido')
        // Skip the write when the membership list is byte-identical: brain.set
        // dirties the whole brain and hubot-mongodb-brain persists ALL of it,
        // so rewriting an unchanged projection every 60s costs a full-document
        // write for nothing.
        //
        // Deliberately compares the PAYLOAD, not `version`: a membership that
        // lapses naturally drops out of the projection without any row's
        // updated_at changing, so the master's version can stay put while the
        // member list moves.
        const current = readProjection()
        if (current && sameMembers(current.members, projection.members)) {
          return current
        }
        robot.brain.set(PROJECTION_KEY, projection)
        return projection
      })
  }

  const postJson = (path, body) => {
    return fetchWithTimeout(`${apiUrl()}${path}`, {
      method: 'POST',
      headers: Object.assign({ 'content-type': 'application/json' }, authHeaders()),
      body: JSON.stringify(body)
    }, response => response.json().catch(() => ({}))).then(({ response, data }) => {
      if (!response.ok) {
        const err = new Error(`HTTP ${response.status}`)
        err.status = response.status
        err.body = data
        throw err
      }
      return data
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

  const listChannels = async () => {
    const channels = []
    let cursor
    for (let page = 0; page < 10 && (page === 0 || cursor); page++) {
      const result = await web.conversations.list({
        limit: 200,
        cursor,
        types: 'public_channel,private_channel'
      })
      channels.push(...(result.channels || []))
      cursor = result.response_metadata && result.response_metadata.next_cursor
    }
    return channels
  }

  const normalizeSlackHandle = (handle, slackId) => {
    if (typeof handle !== 'string') return null
    const normalized = handle.trim().replace(/^@/, '')
    const sentinel = normalized.toLowerCase()
    if (!normalized || normalized === slackId || sentinel === 'undefined' || sentinel === 'null') return null
    return normalized
  }

  const readSlackHandleCache = () => {
    const cache = robot.brain.get(SLACK_HANDLE_CACHE_KEY)
    return cache && typeof cache === 'object' && !Array.isArray(cache) ? cache : {}
  }

  const readSlackHandleCacheEntry = slackId => {
    const entry = readSlackHandleCache()[slackId]
    if (!entry || typeof entry !== 'object') return null
    const handle = normalizeSlackHandle(entry.handle, slackId)
    if (!handle || !Number.isFinite(entry.resolvedAt)) return null
    return { handle, resolvedAt: entry.resolvedAt }
  }

  const persistResolvedSlackHandles = identities => {
    const cache = readSlackHandleCache()
    const next = Object.assign({}, cache)
    const resolvedAt = Date.now()
    let changed = false
    for (const identity of identities) {
      const slackId = identity && identity.id
      const handle = normalizeSlackHandle(identity && identity.handle, slackId)
      if (!identity || !['hubot', 'slack'].includes(identity.handleSource) || !slackId || !handle) continue
      next[slackId] = { handle, resolvedAt }
      if (identity.handleSource === 'slack' && typeof robot.brain.userForId === 'function') {
        robot.brain.userForId(slackId).name = handle
      }
      changed = true
    }
    if (changed) robot.brain.set(SLACK_HANDLE_CACHE_KEY, next)
  }

  const plainUserReference = identity => {
    const slackId = identity && (identity.id || identity.slackId)
    const handle = normalizeSlackHandle(identity && identity.handle, slackId)
    if (handle) return handle
    if (typeof slackId === 'string' && slackId) return slackId
    return 'usuario desconocido'
  }

  const membershipIdentityPayload = identity => {
    const payload = { handle: identity.handle }
    if (identity.id) payload.id = identity.id
    return payload
  }

  const announceSubscription = (reference, paidThrough) => {
    const date = formatDate(paidThrough)
    const until = date ? ` hasta el ${date}` : ''
    const message = `:clap2: *${reference}* se suscribió a :huemul:, se lleva un regalito :devschile: y es miembro gold :monea:${until}!`
    listChannels().then(channels => {
      const configured = process.env.GOLD_CHANNEL &&
        channels.find(ch => ch.name === process.env.GOLD_CHANNEL)
      const channel = configured || channels.find(ch => ch.name === 'random')
      if (!channel) return
      if (!configured) {
        robot.logger.warning(`gold: canal ${process.env.GOLD_CHANNEL || '(sin configurar)'} no encontrado, anunciando en #${channel.name}`)
      }
      robot.send({ room: channel.id }, message)
    }).catch(err => {
      robot.logger.error(`gold: no pude resolver el canal de anuncios: ${err && err.message}`)
    })
  }

  const slackIdFromRawCommand = (res, command) => {
    const message = res && res.message
    const raw = message && (message.rawText || (message.rawMessage && message.rawMessage.text))
    if (typeof raw !== 'string') return null
    const match = raw.match(new RegExp(`\\bgold\\s+${command}\\s+<@([A-Za-z0-9]+)(?:\\|[^>]+)?>`, 'i'))
    return match && match[1]
  }

  const parseCommandTarget = (input, res, command) => {
    const tokens = String(input || '').trim().split(/\s+/).filter(Boolean)
    if (tokens.length === 0) return null
    if (tokens.length > 1 && !/^[1-9][0-9]*$/.test(tokens[1])) return { invalidDays: true }
    const days = tokens.length > 1 ? Number(tokens[1]) : undefined
    const literalMention = String(tokens[0]).match(/^<@([A-Za-z0-9]+)(?:\|[^>]+)?>$/)
    if (literalMention) return { slackId: literalMention[1], handle: null, days }
    const slackId = slackIdFromRawCommand(res, command)
    return {
      slackId,
      handle: normalizeSlackHandle(tokens[0], slackId),
      days
    }
  }

  const fetchSlackIdentity = target => {
    if (!target.slackId) return Promise.resolve({ handle: target.handle, handleSource: 'command' })
    return web.users.info({ user: target.slackId }).then(result => {
      const currentHandle = normalizeSlackHandle(result.user && result.user.name, target.slackId)
      const handle = currentHandle || normalizeSlackHandle(target.handle, target.slackId)
      const handleSource = currentHandle ? 'slack' : 'fallback'
      return { id: target.slackId, handle, handleSource }
    }).catch(err => {
      robot.logger.warning(`gold: no pude actualizar el username de Slack para ${target.slackId}: ${err && err.message}`)
      return { id: target.slackId, handle: target.handle, handleSource: 'fallback' }
    })
  }

  const resolveCurrentSlackIdentity = target => {
    if (!target.slackId) return Promise.resolve({ handle: target.handle, handleSource: 'command' })
    const cacheEntry = readSlackHandleCacheEntry(target.slackId)
    const users = typeof robot.brain.users === 'function' && robot.brain.users()
    const hubotUser = users && users[target.slackId]
    const hubotHandle = normalizeSlackHandle(hubotUser && hubotUser.name, target.slackId)
    if (hubotHandle && (!cacheEntry || hubotHandle !== cacheEntry.handle)) {
      return Promise.resolve({ id: target.slackId, handle: hubotHandle, handleSource: 'hubot' })
    }
    if (cacheEntry && Date.now() - cacheEntry.resolvedAt < SLACK_HANDLE_CACHE_TTL_MS) {
      return Promise.resolve({ id: target.slackId, handle: cacheEntry.handle, handleSource: 'gold-cache' })
    }
    return fetchSlackIdentity(Object.assign({}, target, {
      handle: hubotHandle || target.handle
    }))
  }

  const handleCommandError = (res, operation, message) => err => {
    robot.logger.error(`gold: ${operation}: ${err && err.message}`)
    res.send(message)
  }

  const grantMembership = res => {
    const parsed = parseCommandTarget(res.match[1], res, 'add')
    if (parsed && parsed.invalidDays) return res.send('Los días deben ser un número. Uso: hubot gold add <usuario> [días]')
    if (!parsed || (!parsed.handle && !parsed.slackId)) return res.send('No entendí a quién agregar :monea:.')
    const applyGrant = identity => {
      if (!identity.handle) return res.send('No pude obtener el username actual de Slack :monea:.')
      const reference = plainUserReference(identity)
      const slack = membershipIdentityPayload(identity)
      // Idempotency key: the Slack message id identifies THIS command, so a
      // retried request replays onto the same source_ref and the master's
      // UNIQUE (source, source_ref) turns it into a no-op instead of a second
      // period. Falls back to a per-invocation id when the adapter has no ts.
      const ref = `add:${res.message.id || `${Date.now()}-${Math.random().toString(36).slice(2)}`}`
      const body = { slack, grantedBy: res.message.user.name, note: 'bot gold add', ref }
      if (parsed.days) body.days = parsed.days
      postJson('/api/grants', body)
        .then(result => announceSubscription(reference, paidThroughOf(result)))
        .catch(err => {
          robot.logger.error(`gold: falló el grant para ${reference}: ${err && err.message}`)
          res.send(`No pude dar la membresía gold a ${reference} ahora mismo :monea:.`)
        })
    }
    fetchSlackIdentity(parsed).then(applyGrant)
  }

  const revokeMembership = res => {
    const parsed = parseCommandTarget(res.match[1], res, 'remove')
    if (parsed && parsed.invalidDays) return res.send('Uso: hubot gold remove <usuario>')
    if (!parsed || (!parsed.handle && !parsed.slackId)) return res.send('No entendí a quién quitar :monea:.')
    const revoke = identity => {
      const reference = plainUserReference(identity)
      const slack = membershipIdentityPayload(identity)
      postJson('/api/grants/revoke', { slack })
        .then(result => {
          // The master answers revoked:false for a member who never had gold
          // (or does not exist at all) — say so instead of claiming a change.
          if (result && result.revoked === false) {
            return res.send(`${reference} no era miembro gold :monea:`)
          }
          res.send(`${reference} ya no es miembro gold :monea:`)
        })
        .catch(err => {
          robot.logger.error(`gold: falló la revocación para ${reference}: ${err && err.message}`)
          res.send(`No pude quitar la membresía gold a ${reference} ahora mismo :monea:`)
        })
    }
    fetchSlackIdentity(parsed).then(revoke)
  }

  robot.respond(/gold status (\S+)/i, res => {
    const target = parseCommandTarget(res.match[1], res, 'status')
    if (!target) return res.send('No entendí a quién consultar :monea:.')
    const isSelf = target.slackId
      ? target.slackId === res.message.user.id
      : target.handle === res.message.user.name
    if (!isSelf && !canManageGold(res.message.user)) {
      return res.send(NOT_ALLOWED)
    }
    const sendStatus = (member, identity) => {
      const reference = plainUserReference(identity)
      if (!member) return res.send(`${reference} no es gold :monea:`)
      const date = formatDate(member.paidThrough)
      if (isActive(member)) {
        res.send(`${reference} es gold :monea: hasta el ${date}`)
      } else {
        res.send(`${reference} ya no es gold :monea:, expiró el ${date}`)
      }
    }
    Promise.resolve()
      .then(() => {
        const member = findMember(target)
        const identity = member
          ? Object.assign({}, member, { handle: target.handle || member.handle })
          : target
        return resolveCurrentSlackIdentity(identity).then(identity => ({ member, identity }))
      })
      .then(({ member, identity }) => {
        if (member) persistResolvedSlackHandles([identity])
        sendStatus(member, identity)
      })
      .catch(handleCommandError(
        res,
        'falló gold status',
        'No pude consultar el estado gold ahora mismo :monea:.'
      ))
  })

  robot.respond(/gold list\s*$/i, res => {
    if (!canManageGold(res.message.user)) return res.send(NOT_ALLOWED)
    Promise.resolve()
      .then(() => {
        const projection = readProjection()
        const members = (projection && Array.isArray(projection.members)) ? projection.members : []
        const active = members.filter(member => isActive(member))
        if (active.length === 0) return null
        return Promise.all(active.map(member => resolveCurrentSlackIdentity(member)))
      })
      .then(identities => {
        if (!identities) return res.send('No hay usuarios gold :monea:')
        persistResolvedSlackHandles(identities)
        res.send(identities.map(plainUserReference).join(', '))
      })
      .catch(handleCommandError(
        res,
        'falló gold list',
        'No pude listar los usuarios gold ahora mismo :monea:.'
      ))
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
    if (!canManageGold(res.message.user)) return res.send(NOT_ALLOWED)
    grantMembership(res)
  })

  robot.respond(/gold remove (.+)/i, res => {
    if (!canManageGold(res.message.user)) return res.send(NOT_ALLOWED)
    revokeMembership(res)
  })

  robot.respond(/gold link (\S+)/i, res => {
    const code = res.match[1]
    postJson('/api/link/slack', {
      code,
      slackId: res.message.user.id,
      handle: res.message.user.name
    })
      .then(() => res.send(':clap2: cuenta vinculada :monea:'))
      .catch(err => {
        robot.logger.error(`gold: falló la vinculación de cuenta: ${err && err.message}`)
        res.send('El código no es válido o expiró :monea:.')
      })
  })

  robot.router.post('/gold/sync', async (req, res) => {
    const secret = process.env.GOLD_SYNC_SECRET
    const header = req.get('authorization') || ''
    if (!secret || !timingSafeEqualStr(header, `Bearer ${secret}`)) {
      return res.status(401).json({ error: 'unauthorized' })
    }
    try {
      if (!syncRefresh) syncRefresh = refresh().finally(() => { syncRefresh = null })
      await syncRefresh
      res.status(204).end()
    } catch (err) {
      logRefreshError(err)
      res.status(502).json({ error: 'sync_failed' })
    }
  })

  robot.router.post('/gold/webhook', (req, res) => {
    res.status(410).json({
      error: 'moved',
      to: 'https://soy.devschile.cl/api/webhooks/reveniu'
    })
  })

  // Hubot's Brain#set emits 'loaded' (brain.coffee:31), not just the initial
  // load — so an unguarded handler here re-entered itself: refresh() wrote the
  // projection, the write emitted 'loaded', which called refresh() again, with
  // no delay and no end. Boot-time wiring must happen exactly once.
  //
  // Known consequence: if another script writes to the brain before Mongo
  // finishes hydrating, we initialize on THAT emit and the later mergeData can
  // overwrite our fresh projection with the persisted one. The 60s poll heals
  // it, so the worst case is one stale minute — accepted over re-entrancy.
  let started = false
  robot.brain.on('loaded', () => {
    if (started) return
    started = true
    pollTimer = setInterval(() => refresh().catch(logRefreshError), POLL_MS)
    if (typeof pollTimer.unref === 'function') pollTimer.unref()
    refresh().catch(logRefreshError)
  })
}
