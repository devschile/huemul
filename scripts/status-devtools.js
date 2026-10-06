// Description:
//   Resume el estado de herramientas de desarrollo.
//
// Commands:
//   hubot devtools status - Muestra el resumen de todos los servicios.
//   hubot devtools status --resumen - Muestra sólo los servicios con incidencias.
//   hubot devtools status <servicio> - Muestra detalle acotado de un servicio.
//
// Author:
//   @jorgeepunan

const MAX_BLOCK_TEXT = 2800
const MAX_FALLBACK_TEXT = 3500
const SERVICES = [
  { key: 'github', name: 'GitHub', type: 'statuspage', url: 'https://www.githubstatus.com/api/v2/summary.json', pageUrl: 'https://www.githubstatus.com/' },
  { key: 'gitlab', name: 'GitLab', type: 'statusio', url: 'https://api.status.io/1.0/status/5b36dc6502d06804c08349f7', pageUrl: 'https://status.gitlab.com/' },
  { key: 'bitbucket', name: 'Bitbucket', type: 'statuspage', url: 'https://bqlf8qjztdtr.statuspage.io/api/v2/summary.json', pageUrl: 'https://bitbucket.status.atlassian.com/' },
  { key: 'cloudflare', name: 'Cloudflare', type: 'statuspage', url: 'https://www.cloudflarestatus.com/api/v2/summary.json', pageUrl: 'https://www.cloudflarestatus.com/' },
  { key: 'claude', name: 'Claude', type: 'statuspage', url: 'https://status.anthropic.com/api/v2/summary.json', pageUrl: 'https://status.claude.com/' },
  { key: 'openai', name: 'OpenAI', type: 'statuspage', url: 'https://status.openai.com/api/v2/summary.json', pageUrl: 'https://status.openai.com/' },
  { key: 'vercel', name: 'Vercel', type: 'statuspage', url: 'https://www.vercel-status.com/api/v2/summary.json', pageUrl: 'https://www.vercel-status.com/' },
  { key: 'netlify', name: 'Netlify', type: 'statuspage', url: 'https://www.netlifystatus.com/api/v2/summary.json', pageUrl: 'https://www.netlifystatus.com/' },
  // OpenCode no publica un status propio: npm cubre la disponibilidad de instalación y actualizaciones.
  { key: 'opencode', name: 'NPM (OpenCode updates)', type: 'statuspage', url: 'https://status.npmjs.org/api/v2/summary.json', pageUrl: 'https://status.npmjs.org/' }
]

const timeout = () => Number(process.env.HUBOT_DEVTOOLS_STATUS_TIMEOUT_MS) || 8000
const truncate = (value, max) => value.length > max ? `${value.slice(0, max - 1)}…` : value
const blockText = value => truncate(value, MAX_BLOCK_TEXT)
const escapeSlack = value => String(value || '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/\bhttps?:\/\/\S+/gi, url => url.replace('://', ':\u200b//'))

const isObject = value => Boolean(value) && typeof value === 'object' && !Array.isArray(value)

const unknown = (service, description = 'Sin respuesta') => ({
  ...service,
  indicator: 'unknown',
  description,
  incidents: [],
  components: []
})

const parseStatuspage = (service, payload) => {
  const { page, status, incidents, components } = payload || {}
  const validComponent = component => isObject(component) && typeof component.name === 'string' && typeof component.status === 'string'
  const validUpdate = update => isObject(update) && typeof update.body === 'string'
  const validIncident = incident => isObject(incident) && typeof incident.name === 'string' &&
    (incident.incident_updates == null || (Array.isArray(incident.incident_updates) && incident.incident_updates.every(validUpdate)))
  if (!isObject(payload) || !isObject(page) || typeof page.url !== 'string' || typeof page.updated_at !== 'string' ||
    !isObject(status) || typeof status.indicator !== 'string' || typeof status.description !== 'string' ||
    !Array.isArray(incidents) || !incidents.every(validIncident) || !Array.isArray(components) || !components.every(validComponent)) throw new Error('Respuesta Statuspage incompleta')
  return {
    ...service,
    indicator: status.indicator,
    description: status.description,
    incidents,
    components,
    pageUrl: service.pageUrl || service.url
  }
}

const parseStatusio = (service, payload) => {
  const result = payload && payload.result
  const overall = result && result.status_overall
  const validUpdate = update => isObject(update) && typeof update.body === 'string'
  const validIncident = incident => isObject(incident) && typeof incident.name === 'string' &&
    (incident.incident_updates == null || (Array.isArray(incident.incident_updates) && incident.incident_updates.every(validUpdate)))
  if (!isObject(payload) || !isObject(result) || !isObject(overall) || typeof overall.status !== 'string' ||
    typeof overall.status_code !== 'number' || !Array.isArray(result.incidents) || !result.incidents.every(validIncident)) throw new Error('Respuesta Status.io incompleta')
  return {
    ...service,
    indicator: overall.status_code === 100 ? 'none' : 'major',
    description: overall.status,
    incidents: result.incidents || [],
    components: [],
    pageUrl: service.pageUrl || service.url
  }
}

const fetchService = (robot, service) => new Promise(resolve => {
  robot.http(service.url).timeout(timeout()).get()((err, res, body) => {
    if (err) return resolve(unknown(service))
    if (!res || res.statusCode !== 200) return resolve(unknown(service, `HTTP ${res && res.statusCode}`))
    try {
      const payload = JSON.parse(body)
      resolve(service.type === 'statusio' ? parseStatusio(service, payload) : parseStatuspage(service, payload))
    } catch (error) {
      resolve(unknown(service, 'Respuesta inválida'))
    }
  })
})

const statusLine = status => `:${status.indicator === 'none' ? 'white_check_mark' : 'red_circle'}: ${escapeSlack(status.name)} — ${escapeSlack(status.description)}`
const summaryText = (statuses, summaryOnly) => {
  const shown = summaryOnly ? statuses.filter(status => status.indicator !== 'none') : statuses
  const lines = shown.length ? shown.map(status => truncate(statusLine(status), 400)) : [':white_check_mark: Sin incidentes activos']
  return truncate(`*Estado DevTools*\n${lines.join('\n')}`, MAX_FALLBACK_TEXT)
}

const blockLineGroups = lines => {
  const groups = []
  let current = ''
  for (const line of lines) {
    const safeLine = truncate(line, 700)
    if (current && current.length + safeLine.length + 1 > MAX_BLOCK_TEXT) {
      groups.push(current)
      current = safeLine
    } else current = current ? `${current}\n${safeLine}` : safeLine
  }
  if (current) groups.push(current)
  return groups
}

const buildSummaryBlocks = (statuses, summaryOnly = true) => {
  const incidents = statuses.filter(status => status.indicator !== 'none')
  const operational = statuses.filter(status => status.indicator === 'none')
  const lines = incidents.length
    ? incidents.map(status => `:red_circle: <${status.pageUrl}|*${status.name}*> — ${escapeSlack(status.description)}`)
    : [':white_check_mark: Sin incidentes activos']
  const blocks = [
    { type: 'header', text: { type: 'plain_text', text: 'Estado DevTools', emoji: true } },
    { type: 'section', text: { type: 'mrkdwn', verbatim: true, text: blockText(`*Resumen* · ${incidents.length} con incidencia · ${operational.length} operativos`) } },
    ...blockLineGroups(lines).map(text => ({ type: 'section', text: { type: 'mrkdwn', verbatim: true, text } }))
  ]

  if (!summaryOnly) {
    if (incidents.length) {
      blocks.push({
        type: 'actions',
        elements: incidents.slice(0, 3).map(status => ({
          type: 'button',
          text: { type: 'plain_text', text: status.name, emoji: true },
          url: status.pageUrl
        }))
      })
    }
    blocks.push({ type: 'divider' })
    blocks.push({
      type: 'section',
      text: { type: 'mrkdwn', verbatim: true, text: blockText(`*Operativos*\n${operational.map(status => `:white_check_mark: ${escapeSlack(status.name)}`).join(' · ') || '—'}`) }
    })
  }

  return blocks
}

const detailData = status => {
  const components = Array.isArray(status.components) ? status.components : []
  const incidents = Array.isArray(status.incidents) ? status.incidents : []
  return {
    description: escapeSlack(status.description),
    affected: components.filter(component => component && component.status && component.status !== 'operational').slice(0, 3).map(component => escapeSlack(component.name)),
    updates: incidents.flatMap(incident => Array.isArray(incident && incident.incident_updates) ? incident.incident_updates.map(update => ({
      incident: escapeSlack(incident.name),
      body: escapeSlack(update && update.body)
    })) : []).filter(update => update.body).slice(0, 3)
  }
}

const detailText = status => {
  const detail = detailData(status)
  const lines = [`*Estado ${escapeSlack(status.name)}* — ${detail.description}`]
  if (detail.affected.length) lines.push(`Componentes afectados: ${detail.affected.join(', ')}`)
  for (const update of detail.updates) lines.push(`${update.incident}: ${update.body}`)
  return truncate(lines.join('\n'), MAX_FALLBACK_TEXT)
}

const buildDetailBlocks = status => {
  const detail = detailData(status)
  const blocks = [
    { type: 'header', text: { type: 'plain_text', text: `Estado ${status.name}`, emoji: true } },
    { type: 'section', text: { type: 'mrkdwn', verbatim: true, text: blockText(`<${status.pageUrl}|*${status.name}*> — ${detail.description}`) } }
  ]

  if (detail.affected.length) {
    blocks.push({
      type: 'section',
      text: { type: 'mrkdwn', verbatim: true, text: blockText(`*Componentes afectados*\n${detail.affected.map(name => `• ${name}`).join('\n')}`) }
    })
  }
  if (detail.updates.length) {
    blocks.push({
      type: 'section',
      text: { type: 'mrkdwn', verbatim: true, text: blockText(`*Últimas actualizaciones*\n${detail.updates.map(update => `*${update.incident}*: ${update.body}`).join('\n')}`) }
    })
  }
  blocks.push({
    type: 'actions',
    elements: [{ type: 'button', text: { type: 'plain_text', text: `Abrir ${status.name}`, emoji: true }, url: status.pageUrl }]
  })
  return blocks
}

module.exports = robot => {
  const help = [
    '*DevTools — uso*',
    '• `hubot devtools status` — resumen de todos los servicios.',
    '• `hubot devtools status --resumen` — sólo servicios con incidencias.',
    '• `hubot devtools status <servicio>` — detalle de un servicio.',
    '*Servicios:* github, gitlab, bitbucket, cloudflare, claude, openai, vercel, netlify, opencode.',
    '_OpenCode se reporta vía disponibilidad de NPM para instalación y actualizaciones._'
  ].join('\n')

  // hubot-slack 4.10 uses @slack/client 3.x, whose form encoder requires Block Kit as JSON text.
  const post = (msg, blocks, text) => msg.send({
    text,
    blocks: JSON.stringify(blocks),
    unfurl_links: false,
    unfurl_media: false
  })

  const sendStatus = (msg, summaryOnly) => {
    Promise.all(SERVICES.map(service => fetchService(robot, service))).then(statuses => {
      post(msg, buildSummaryBlocks(statuses, summaryOnly), summaryText(statuses, summaryOnly))
    })
  }

  robot.respond(/devtools$/i, msg => msg.send(help))
  robot.respond(/devtools status --resumen$/i, msg => sendStatus(msg, true))
  robot.respond(/devtools status$/i, msg => sendStatus(msg, false))
  robot.respond(/devtools status ([a-z][a-z0-9-]*)$/i, msg => {
    const service = SERVICES.find(candidate => candidate.key === msg.match[1].toLowerCase())
    if (!service) return msg.send(`No conozco el servicio '${msg.match[1]}'.`)
    fetchService(robot, service).then(status => post(msg, buildDetailBlocks(status), detailText(status)))
  })
}

module.exports._test = { SERVICES, buildDetailBlocks, buildSummaryBlocks, detailText, parseStatusio, parseStatuspage, summaryText }
