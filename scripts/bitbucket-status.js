// Description:
//   Show current Bitbucket status and messages
//
// Dependencies:
//   None
//
// Configuration:
//   None
//
// Commands:
//   hubot bitbucket status - Returns current status and active incidents.
//
// Author:
//   @raerpo

const MAX_BLOCK_TEXT = 2800
const MAX_FALLBACK_TEXT = 3500
const BITBUCKET_PAGE_URL = 'https://bitbucket.status.atlassian.com/'
const timeout = () => Number(process.env.HUBOT_BITBUCKET_STATUS_TIMEOUT_MS) || 8000

const escapeSlack = value => String(value || '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/\bhttps?:\/\/\S+/gi, url => url.replace('://', ':\u200b//'))

const truncate = (value, max) => value.length > max ? `${value.slice(0, max - 1)}…` : value
const blockText = value => truncate(value, MAX_BLOCK_TEXT)

const isObject = value => Boolean(value) && typeof value === 'object' && !Array.isArray(value)
const relativeTime = date => {
  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000))
  if (seconds < 60) return `hace ${seconds} s`
  if (seconds < 3600) return `hace ${Math.floor(seconds / 60)} min`
  if (seconds < 86400) return `hace ${Math.floor(seconds / 3600)} h`
  return `hace ${Math.floor(seconds / 86400)} d`
}

const summaryParts = ({ page, status, components, incidents }) => {
  const updatedAt = new Date(page && page.updated_at)
  const validComponent = component => isObject(component) && typeof component.name === 'string' && typeof component.status === 'string'
  const validUpdate = update => isObject(update) && typeof update.body === 'string'
  const validIncident = incident => isObject(incident) && typeof incident.name === 'string' &&
    (incident.incident_updates == null || (Array.isArray(incident.incident_updates) && incident.incident_updates.every(validUpdate)))
  if (!isObject(page) || typeof page.url !== 'string' || typeof page.updated_at !== 'string' || Number.isNaN(updatedAt.getTime()) ||
    !isObject(status) || typeof status.indicator !== 'string' || typeof status.description !== 'string' ||
    !Array.isArray(components) || !components.every(validComponent) || !Array.isArray(incidents) || !incidents.every(validIncident)) throw new Error('Respuesta Statuspage incompleta')
  return {
    description: escapeSlack(status.description),
    updatedAgo: relativeTime(updatedAt),
    affected: components.filter(component => component.status !== 'operational').slice(0, 3),
    updates: incidents.flatMap(incident => (incident.incident_updates || []).map(update => ({
      incident: escapeSlack(incident.name),
      body: escapeSlack(update.body)
    }))).slice(0, 3)
  }
}

const buildText = summary => {
  const lines = [`*Estado Bitbucket* — ${summary.description} _(${summary.updatedAgo})_`]
  if (summary.affected.length) lines.push(`Componentes afectados: ${summary.affected.map(component => escapeSlack(component.name)).join(', ')}`)
  for (const update of summary.updates) lines.push(`${update.incident}: ${update.body}`)
  return truncate(lines.join('\n'), MAX_FALLBACK_TEXT)
}

const buildBlocks = payload => {
  const summary = summaryParts(payload)
  const pageUrl = BITBUCKET_PAGE_URL
  const blocks = [
    { type: 'header', text: { type: 'plain_text', text: 'Estado Bitbucket', emoji: true } },
    { type: 'section', text: { type: 'mrkdwn', verbatim: true, text: blockText(`<${pageUrl}|*Bitbucket*> — ${summary.description} _(${summary.updatedAgo})_`) } }
  ]

  if (summary.affected.length) {
    blocks.push({
      type: 'section',
      text: { type: 'mrkdwn', verbatim: true, text: blockText(`*Componentes afectados*\n${summary.affected.map(component => `• ${escapeSlack(component.name)}`).join('\n')}`) }
    })
  }
  if (summary.updates.length) {
    blocks.push({
      type: 'section',
      text: { type: 'mrkdwn', verbatim: true, text: blockText(`*Últimas actualizaciones*\n${summary.updates.map(update => `*${update.incident}*: ${update.body}`).join('\n')}`) }
    })
  }
  blocks.push({
    type: 'actions',
    elements: [{ type: 'button', text: { type: 'plain_text', text: 'Abrir Bitbucket', emoji: true }, url: pageUrl }]
  })
  return blocks
}

module.exports = robot => {
  robot.respond(/bitbucket status$/i, msg => {
    robot.http('https://bqlf8qjztdtr.statuspage.io/api/v2/summary.json')
      .timeout(timeout())
      .get()((err, res, body) => {
        if (err || !res || res.statusCode !== 200) {
          return robot.emit('error', err || new Error(`Status code ${res && res.statusCode}`), msg, 'bitbucket-status')
        }
        try {
          const status = JSON.parse(body)
          const summary = summaryParts(status)
          const payload = {
            text: buildText(summary),
            blocks: buildBlocks(status),
            unfurl_links: false,
            unfurl_media: false
          }
          return msg.send(payload)
        } catch (error) {
          robot.emit('error', error, msg, 'bitbucket-status')
          return msg.send(':bitbucket: No pude interpretar el estado de Bitbucket.')
        }
      })
  })
}

module.exports._test = { buildBlocks, buildText, summaryParts }
