// Description:
//   Busca ofertas de trabajo en yodev.dev - plataforma de empleos para desarrolladores
//
// Dependencies:
//   - process.env: Access to environment variables
//
// Configuration:
//   YODEV_API_URL - URL del endpoint de InnovaJobs
//
// Commands:
//   hubot yodev <query> - Busca ofertas de trabajo relacionadas con el query
//
// Examples:
//   hubot yodev javascript - Busca trabajos de JavaScript
//
// Author:
//   @jorgeepunan

const https = require('https')

// Configuración desde variables de entorno
const YODEV_API_URL = process.env.YODEV_API_URL || 'https://yodev.dev/api/jobs'

module.exports = (robot) => {
  robot.respond(/yodev\s+(.+)/i, (res) => {
    const query = res.match[1]
    const url = `${YODEV_API_URL}?query=${encodeURIComponent(query)}&country=chile`

    const isSlack = robot.adapter && robot.adapter.constructor && robot.adapter.constructor.name === 'SlackBot'
    const send = (text) => {
      if (isSlack && robot.adapter.client && robot.adapter.client.web) {
        const options = { unfurl_links: false, unfurl_media: false, as_user: true }
        return robot.adapter.client.web.chat.postMessage(res.message.room, text, options)
      }

      return res.send(text)
    }

    send(`🔎 Buscando *${query}*... explorando oportunidades en yodev.dev 🚀 💼`)

    https.get(url, (response) => {
      let data = ''

      response.on('data', (chunk) => {
        data += chunk
      })

      response.on('end', () => {
        try {
          const responseData = JSON.parse(data)
          const jobs = Array.isArray(responseData.jobs) ? responseData.jobs : []
          const totalJobs = responseData.total_jobs || jobs.length
          const viewMoreUrl = responseData.view_more_url

          if (jobs.length === 0) {
            const noResults = [
              '🤖💥 404: yodev not found. Intenta con otro query antes de que tu portfolio se quede sin commits.',
              '😅🛠️ Nada por aquí… parece que yodev está en modo mantenimiento. Prueba otro término.',
              '🥲⌨️ Cero resultados. Ni un "Hello World" de trabajo apareció. Cambia el query y reintenta.',
              '😭🐛 Encontré exactamente 0 ofertas. Es como buscar bugs en producción: siempre aparecen… excepto hoy.'
            ]
            return send(noResults[Math.floor(Math.random() * noResults.length)])
          }

          const limitedJobs = jobs.slice(0, 5)
          const messages = limitedJobs.map((job) => {
            const lines = [`
*${job.title}*`,
              `*Empresa:* ${job.company}`,
              `*Ubicación:* ${job.location}`,
              `*Postulación:* ${job.url}`,
              `*Publicado:* ${job.posted || job.date || ''}`
            ]

            if (job.salary) lines.push(`*Sueldo:* ${job.salary}`)
            if (job.type) lines.push(`*Tipo:* ${job.type}`)
            if (job.source) lines.push(`*Fuente:* ${job.source}`)

            return lines.join('\n')
          })

          if (viewMoreUrl) {
            messages.push(`\n🔍 ¿Quieres ver más ofertas? Visita: ${viewMoreUrl}`)
          }

          send(`✅ Encontré ${totalJobs} resultado(s) en yodev.dev:\n\n${messages.join('\n\n---\n\n')}`)
        } catch (error) {
          robot.logger.error(`Error al parsear la respuesta: ${error.message}`)
          send('Ups! Ocurrió un error al procesar las ofertas de trabajo de yodev.dev. 😱')
        }
      })
    }).on('error', (error) => {
      robot.logger.error(`Error al buscar ofertas de trabajo: ${error.message}`)
      send('Ups! Ocurrió un error al buscar ofertas de trabajo en yodev.dev. 😱')
    })
  })
}
