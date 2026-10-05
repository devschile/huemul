// Description:
//   Show current GitHub status and messages
//
// Dependencies:
//   None
//
// Configuration:
//   None
//
// Commands:
//   hubot github status - Returns the latest incident update, including resolved incidents.
//   hubot github status resume - Returns the current system status and timestamp.
//   hubot github status all - Returns up to ten recent incident updates.
//
// Author:
//   voke
//
// Modified by:
//   @jorgeepunan

module.exports = robot => {
  const MAX_MESSAGE_TEXT = 3500
  const escapeSlack = string => String(string || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\bhttps?:\/\/\S+/gi, url => url.replace('://', ':\u200b//'))
  const truncate = string => string.length > MAX_MESSAGE_TEXT ? `${string.slice(0, MAX_MESSAGE_TEXT - 1)}…` : string
  // NOTE: messages contains new lines for some reason.
  const formatString = string => escapeSlack(String(string || '').replace(/(?:\\n|\r?\n)/g, ' '))
  const parseIncidents = body => {
    const incidents = JSON.parse(body).incidents
    const validDate = value => typeof value === 'string' && !Number.isNaN(new Date(value).getTime())
    const validUpdate = update => update && typeof update === 'object' && typeof update.status === 'string' &&
      typeof update.body === 'string' && validDate(update.created_at)
    const validIncident = incident => incident && typeof incident === 'object' && typeof incident.name === 'string' &&
      typeof incident.status === 'string' && (incident.incident_updates == null ||
      (Array.isArray(incident.incident_updates) && incident.incident_updates.every(validUpdate)))
    if (!Array.isArray(incidents) || !incidents.every(validIncident)) throw new Error('Respuesta GitHub Status incompleta')
    return incidents
  }
  const parseSystemStatus = body => {
    const json = JSON.parse(body)
    const date = new Date(json && json.page && json.page.updated_at)
    if (!json || !json.page || !json.status || typeof json.page.updated_at !== 'string' || typeof json.status.indicator !== 'string' || typeof json.status.description !== 'string' || Number.isNaN(date.getTime())) throw new Error('Respuesta GitHub Status incompleta')
    return { json, date }
  }
  const malformedResponse = (error, msg) => {
    robot.emit('error', error, msg, 'github-status')
    return msg.send(':octocat: No pude interpretar el estado de GitHub.')
  }

  robot.respond(/github status$/i, msg => {
    robot.http('https://www.githubstatus.com/api/v2/incidents.json')
      .timeout(8000)
      .get()((err, res, body) => {
        if (err || !res || res.statusCode !== 200) {
          return robot.emit('error', err || new Error(`Status code ${res && res.statusCode}`), msg, 'github-status')
        }
        try {
          const update = parseIncidents(body).flatMap(incident => (incident.incident_updates || []).map(item => ({ ...item, incident: incident.name })))
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]
          if (!update) return msg.send(':octocat: *[operational]* Sin actualizaciones de incidentes.')
          const date = new Date(update.created_at)
          msg.send(truncate(`:octocat: *[${escapeSlack(update.status)}]* ${escapeSlack(update.incident)}: ${formatString(update.body)} _(${date.toLocaleString()})_`))
        } catch (error) {
          return malformedResponse(error, msg)
        }
      })
  })

  robot.respond(/github status resume$/i, msg => {
    robot.http('https://www.githubstatus.com/api/v2/status.json')
      .timeout(8000)
      .get()((err, res, body) => {
        if (err || !res || res.statusCode !== 200) {
          return robot.emit('error', err || new Error(`Status code ${res && res.statusCode}`), msg, 'github-status')
        }
        try {
          const { json, date } = parseSystemStatus(body)
          const now = new Date()
          const secondsAgo = Math.round((now.getTime() - date.getTime()) / 1000)
          msg.send(truncate(`:octocat: Status: *[${escapeSlack(json.status.indicator)}]* ${formatString(json.status.description)} _(${secondsAgo} seconds ago)_`))
        } catch (error) {
          return malformedResponse(error, msg)
        }
      })
  })

  robot.respond(/github status all$/i, msg => {
    robot.http('https://www.githubstatus.com/api/v2/incidents.json')
      .timeout(8000)
      .get()((err, res, body) => {
        if (err || !res || res.statusCode !== 200) {
          return robot.emit('error', err || new Error(`Status code ${res && res.statusCode}`), msg, 'github-status')
        }
        try {
          const updates = parseIncidents(body).flatMap(incident => {
            if (!incident || typeof incident !== 'object' || (incident.incident_updates && !Array.isArray(incident.incident_updates))) throw new Error('Respuesta GitHub Status incompleta')
            return (incident.incident_updates || []).map(update => ({
              ...update,
              incident: incident.name
            }))
          }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 10)
          if (!updates.length) return msg.send(':octocat: No hay actualizaciones recientes.')
          const messages = updates.map(update => {
            const date = new Date(update.created_at)
            return `:octocat: *[${escapeSlack(update.status)}]* ${escapeSlack(update.incident)}: ${formatString(update.body)} _(${date.toLocaleString()})_`
          })
          msg.send(truncate(messages.join('\n')))
        } catch (error) {
          return malformedResponse(error, msg)
        }
      })
  })
}
