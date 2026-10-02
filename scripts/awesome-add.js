// Description:
//   Propone recursos de Slack para Awesome devsChile tras respaldo comunitario
//
// Dependencies:
//   @slack/web-api
//   node-fetch
//
// Configuration:
//   HUBOT_SLACK_TOKEN - requiere channels:history, channels:read, reactions:read y users:read
//   GITHUB_AWESOME_TOKEN - Contents: write y Pull requests: write en awesome-devschile
//
// Commands:
//   hubot awesome add <link de mensaje Slack> - crea un PR manual si hay respaldo y aprobación admin
//
// Author:
//   @jorgeepunan

const crypto = require('crypto')
const fetch = require('node-fetch')
const slackClient = require('./helpers/client')

const AWESOME_OWNER = 'devschile'
const AWESOME_REPO = 'awesome-devschile'
const AWESOME_BRANCH = 'master'
const APPROVAL_EMOJI = 'thumbs-ups'
const SUPPORT_RE = /(?:agreg|anad|inclu|recomiend|apoy|merece)/i
const AWESOME_RE = /(?:awesome|lista)/i

const normalizeUrl = value => String(value || '').trim().toLowerCase()
  .replace(/^https?:\/\//, '')
  .replace(/^www\./, '')
  .replace(/\/+$/, '')

const toPlainText = value => String(value || '')
  .replace(/<([^>|]+)\|([^>]+)>/g, '$2')
  .replace(/<([^>]+)>/g, '$1')
  .replace(/https?:\/\/[^\s]+/g, '')
  .replace(/[\r\n]+/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()

const cleanMarkdownText = value => toPlainText(value)
  .replaceAll('[', '')
  .replaceAll(']', '')
  .replace(/\s+/g, ' ')
  .trim()

const safeHttpUrl = value => {
  try {
    const parsed = new URL(value)
    return ['http:', 'https:'].includes(parsed.protocol) ? parsed.href : null
  } catch (err) {
    return null
  }
}

const parseSlackPermalink = permalink => {
  try {
    const parsed = new URL(permalink)
    if (parsed.protocol !== 'https:' || parsed.hostname !== 'devschile.slack.com') return null
    const match = /^\/archives\/([A-Z0-9]+)\/p(\d{10})(\d{6})\/?$/i.exec(parsed.pathname)
    if (!match) return null
    return {
      channel: match[1],
      ts: `${match[2]}.${match[3]}`,
      sourceId: `${match[2]}${match[3]}`,
      permalink: parsed.href
    }
  } catch (err) {
    return null
  }
}

const externalLinks = message => {
  const links = []
  const add = (url, title) => {
    const safe = safeHttpUrl(url)
    if (!safe || new URL(safe).hostname === 'devschile.slack.com') return
    links.push({ url: safe, title: cleanMarkdownText(title) })
  }

  for (const attachment of (message.attachments || [])) {
    add(attachment.title_link || attachment.from_url, attachment.title)
  }

  const text = [message.text, message.blocks && JSON.stringify(message.blocks)].filter(Boolean).join(' ')
  for (const match of text.matchAll(/<((?:https?:\/\/)[^>|]+)(?:\|([^>]+))?>/g)) {
    add(match[1], match[2])
  }
  for (const match of text.matchAll(/(?<![<"'])https?:\/\/[^\s>]+/g)) {
    add(match[0], '')
  }
  return links
}

const candidateFromMessage = message => {
  const link = externalLinks(message)[0]
  if (!link) return null
  const attachment = (message.attachments || []).find(item => normalizeUrl(item.title_link || item.from_url) === normalizeUrl(link.url))
  const title = cleanMarkdownText((attachment && attachment.title) || link.title || new URL(link.url).hostname.replace(/^www\./, ''))
  const description = cleanMarkdownText((attachment && (attachment.text || attachment.fallback)) || message.text)
  if (!title || !description) return null
  return { title, url: link.url, description }
}

const isSupport = (message, author) => {
  if (!message || !message.user || message.user === author) return false
  const text = toPlainText(message.text)
  return SUPPORT_RE.test(text) && AWESOME_RE.test(text)
}

const reactionUsers = messages => {
  const users = new Set()
  for (const message of messages) {
    for (const reaction of (message.reactions || [])) {
      if (reaction.name !== APPROVAL_EMOJI) continue
      for (const user of (reaction.users || [])) users.add(user)
    }
  }
  return [...users]
}

const isAdmin = user => Boolean(user && (user.is_admin || user.is_owner))

const fetchThread = async (web, source) => {
  try {
    const thread = await web.conversations.replies({ channel: source.channel, ts: source.ts, limit: 200 })
    const messages = thread && thread.messages
    if (!Array.isArray(messages) || messages.length === 0) throw new Error('hilo vacío')
    const linked = messages.find(message => message.ts === source.ts) || messages[0]
    if (linked.thread_ts && linked.thread_ts !== linked.ts) {
      const rootThread = await web.conversations.replies({ channel: source.channel, ts: linked.thread_ts, limit: 200 })
      if (!Array.isArray(rootThread && rootThread.messages) || rootThread.messages.length === 0) throw new Error('hilo raíz vacío')
      return { messages: rootThread.messages, linked }
    }
    return { messages, linked }
  } catch (err) {
    const history = await web.conversations.history({
      channel: source.channel,
      oldest: source.ts,
      latest: source.ts,
      inclusive: true,
      limit: 1
    })
    const linked = history && history.messages && history.messages[0]
    if (!linked || !linked.thread_ts) throw err
    const rootThread = await web.conversations.replies({ channel: source.channel, ts: linked.thread_ts, limit: 200 })
    if (!Array.isArray(rootThread && rootThread.messages) || rootThread.messages.length === 0) throw new Error('hilo raíz vacío')
    return { messages: rootThread.messages, linked }
  }
}

const entryExists = (markdown, url) => {
  const wanted = normalizeUrl(url)
  const links = String(markdown || '').matchAll(/\]\((https?:\/\/[^)\s]+)\)/g)
  return [...links].some(match => normalizeUrl(match[1]) === wanted)
}

const insertEntry = (markdown, channel, entry) => {
  const lines = String(markdown || '').split('\n')
  const heading = new RegExp(`^##\\s+#${channel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`, 'i')
  const start = lines.findIndex(line => heading.test(line))
  if (start < 0) return null
  let end = start + 1
  while (end < lines.length && !/^##\s+/.test(lines[end])) end++
  lines.splice(end, 0, `- [${entry.title}](${entry.url}): ✨ ${entry.description}`, '')
  return lines.join('\n')
}

const branchPart = value => String(value || '').toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '') || 'canal'

const resourceId = url => crypto.createHash('sha256').update(normalizeUrl(url)).digest('hex').slice(0, 16)

const createGithubClient = () => {
  const token = process.env.GITHUB_AWESOME_TOKEN
  const request = async (method, path, body) => {
    if (!token) {
      const err = new Error('GITHUB_AWESOME_TOKEN no configurado')
      err.code = 'github_not_configured'
      throw err
    }
    const response = await fetch(`https://api.github.com${path}`, {
      method,
      headers: {
        accept: 'application/vnd.github+json',
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
        'user-agent': 'devschile-huemul'
      },
      body: body ? JSON.stringify(body) : undefined
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      const err = new Error(`GitHub HTTP ${response.status}`)
      err.status = response.status
      err.data = data
      throw err
    }
    return data
  }
  const repoPath = `/repos/${AWESOME_OWNER}/${AWESOME_REPO}`
  return {
    getReadme: async (ref = AWESOME_BRANCH) => {
      const data = await request('GET', `${repoPath}/contents/README.md?ref=${encodeURIComponent(ref)}`)
      return { content: Buffer.from(data.content || '', 'base64').toString('utf8'), sha: data.sha }
    },
    getBranch: async () => {
      const data = await request('GET', `${repoPath}/git/ref/heads/${AWESOME_BRANCH}`)
      return { sha: data.object && data.object.sha }
    },
    findPullRequest: async branch => {
      const head = encodeURIComponent(`${AWESOME_OWNER}:${branch}`)
      const data = await request('GET', `${repoPath}/pulls?state=open&head=${head}`)
      return Array.isArray(data) ? data[0] || null : null
    },
    ensureBranch: async ({ branch, sha }) => {
      try {
        await request('POST', `${repoPath}/git/refs`, { ref: `refs/heads/${branch}`, sha })
        return { created: true }
      } catch (err) {
        if (!err || err.status !== 422) throw err
        const existing = await request('GET', `${repoPath}/git/ref/heads/${encodeURIComponent(branch)}`)
        return { created: false, sha: existing.object && existing.object.sha }
      }
    },
    createBranch: ({ branch, sha }) => request('POST', `${repoPath}/git/refs`, { ref: `refs/heads/${branch}`, sha }),
    updateReadme: ({ branch, sha, content, message }) => request('PUT', `${repoPath}/contents/README.md`, {
      message,
      content: Buffer.from(content).toString('base64'),
      branch,
      sha
    }),
    createPullRequest: ({ title, head, base, body }) => request('POST', `${repoPath}/pulls`, { title, head, base, body })
  }
}

module.exports = function (robot, web = slackClient.getClient(), github = createGithubClient()) {
  robot.respond(/awesome\s+add\s+<?(https:\/\/devschile\.slack\.com\/archives\/[^\s>]+)>?\s*$/i, res => {
    const source = parseSlackPermalink(res.match[1])
    if (!source) return res.send('Ese link no parece un permalink de mensaje de devschile Slack.')

    const run = async () => {
      const target = await web.conversations.info({ channel: res.message.room })
      const channel = target && target.channel
      if (!channel || !channel.is_channel || !channel.name) {
        return res.send('Usa este comando dentro del canal donde debe quedar el recurso en Awesome.')
      }

      const thread = await fetchThread(web, source)
      const messages = thread.messages
      const root = messages[0]
      const sourceMessage = thread.linked || root
      const candidate = candidateFromMessage(sourceMessage) || candidateFromMessage(root)
      if (!candidate) {
        return res.send('No pude obtener nombre, link y descripción desde el post enlazado.')
      }

      const supporters = [...new Set(messages.filter(message => isSupport(message, sourceMessage.user)).map(message => message.user))]
      if (supporters.length === 0) {
        return res.send('Aún falta el respaldo explícito de otro usuario en el hilo para proponerlo al Awesome.')
      }

      const approvers = reactionUsers(messages)
      let approved = false
      for (const user of approvers) {
        try {
          const profile = await web.users.info({ user })
          if (isAdmin(profile && profile.user)) {
            approved = true
            break
          }
        } catch (err) {
          robot.logger.warning(`awesome-add: no pude verificar la aprobación de ${user}: ${err && err.message}`)
        }
      }
      if (!approved) {
        return res.send(`Aún falta un :${APPROVAL_EMOJI}: de un admin en el hilo enlazado.`)
      }

      const branch = `huemul/awesome/${branchPart(channel.name)}-${resourceId(candidate.url)}`
      const title = `feat(awesome): agrega ${candidate.title} a #${channel.name}`
      if (typeof github.findPullRequest === 'function') {
        const existing = await github.findPullRequest(branch)
        if (existing && existing.html_url) {
          return res.send(`Ya existe un PR para este aporte: ${existing.html_url}`)
        }
      }
      const masterReadme = await github.getReadme()
      if (entryExists(masterReadme.content, candidate.url)) {
        return res.send(`Ese link ya está incluido en #${channel.name} de Awesome devsChile.`)
      }
      const base = await github.getBranch()
      const branchState = typeof github.ensureBranch === 'function'
        ? await github.ensureBranch({ branch, sha: base.sha })
        : (await github.createBranch({ branch, sha: base.sha }), { created: true })
      const branchReadme = branchState && branchState.created === false
        ? await github.getReadme(branch)
        : masterReadme
      if (!entryExists(branchReadme.content, candidate.url)) {
        const nextReadme = insertEntry(branchReadme.content, channel.name, candidate)
        if (!nextReadme) {
          return res.send(`No encontré la sección #${channel.name} en Awesome devsChile.`)
        }
        await github.updateReadme({ branch, sha: branchReadme.sha, content: nextReadme, message: title })
      }
      const pr = await github.createPullRequest({
        title,
        head: branch,
        base: AWESOME_BRANCH,
        body: `Incluye [${candidate.title}](${candidate.url}) en #${channel.name}.\n\nOrigen: ${source.permalink}\nRespaldo en el hilo: ${supporters.length} ${supporters.length === 1 ? 'usuario' : 'usuarios'}.\n\nRevisión y merge manual.`
      })
      res.send(`PR listo para revisión manual: ${pr.html_url}`)
    }

    run().catch(err => {
      robot.logger.error(`awesome-add: ${err && err.message}`)
      if (err && err.code === 'github_not_configured') {
        res.send('No puedo abrir el PR: falta configurar GITHUB_AWESOME_TOKEN en Huemul.')
      } else {
        res.send('No pude preparar el PR de Awesome ahora mismo.')
      }
    })
  })
}

module.exports._test = {
  parseSlackPermalink,
  candidateFromMessage,
  entryExists,
  insertEntry,
  isSupport
}
