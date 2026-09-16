// Description:
//   Busca pegas recientes en GetOnBrd. Con el flag --gold busca en pegas.devschile.cl,
//   la vitrina de pegas de devsChile que suma más fuentes (LinkedIn, Himalayas,
//   Jobicy y WorkingNomads).
//
//  Dependencies:
//    cheerio
//
// Configuration:
//   HUBOT_PEGAS_TIMEOUT_MS - milisegundos de espera por request a las APIs (default 8000)
//
// Commands:
//   hubot pega|pegas|trabajo|trabajos <oficio> - Busca pegas recientes para el oficio seleccionado en GetOnBrd
//   hubot pega|pegas|trabajo|trabajos <oficio> tldr|mini|short|corta - Retorna 10 resultados condensados de GetOnBrd
//   hubot pega|pegas|trabajo|trabajos --gold <oficio> - Retorna los 3 trabajos más nuevos en pegas.devschile.cl
//
// Author:
//   @dilip
//   @jorgeepunan

const { WebClient } = require('@slack/web-api')
const token = process.env.HUBOT_SLACK_TOKEN
const webClient = new WebClient(token)
const { block, object, TEXT_FORMAT_MRKDWN } = require('slack-block-kit')
const { text } = object
const { section, divider, image, context } = block
const gobApiHost = 'https://www.getonbrd.com/api/v0'
const gobDomain = 'https://www.getonbrd.com'
const siteApiHost = 'https://pegas.devschile.cl'
const siteListUrl = (searchTerm, limit) => `${siteApiHost}/api/pegas?q=${encodeURIComponent(searchTerm)}&porPagina=${limit}`
const siteSearchUrl = (searchTerm) => `${siteApiHost}/?q=${encodeURIComponent(searchTerm)}`
const GOLD_RESULTS = 3
const SITE_FETCH_LIMIT = 50
const DEFAULT_TIMEOUT_MS = 8000

// Node 24 conecta con Happy Eyeballs (autoSelectFamily) y da 250 ms por intento de
// dirección. pegas.devschile.cl publica AAAA vía Cloudflare y desde Chile el connect
// IPv4 puede quedar justo en el límite (mismo caso del geocoding de clima.js):
// con 2 s de presupuesto el handshake alcanza a completarse.
const net = require('net')
if (typeof net.setDefaultAutoSelectFamilyAttemptTimeout === 'function') {
  net.setDefaultAutoSelectFamilyAttemptTimeout(2000)
}

// Extrae --gold de cualquier posición y devuelve el término de búsqueda intacto.
// Ojo: detectar sin /g (test() es stateful); el replace sí lo lleva y respeta
// límites de palabra (no toca términos como "--golden").
const extractSearchFlags = (raw) => {
  const gold = /(^|\s)--gold(\s|$)/.test(raw)
  const term = raw.replace(/(^|\s)--gold(?=\s|$)/g, ' ').replace(/\s+/g, ' ').trim()
  return { term, gold }
}

// Normaliza URLs para comparar entre fuentes (protocolo, www, slash final, mayúsculas)
const normalizeUrl = (url) => String(url || '').trim().toLowerCase()
  .replace(/^https?:\/\//, '')
  .replace(/^www\./, '')
  .replace(/\/+$/, '')

// Cuántas pegas hay en pegas.devschile.cl para el término, sin contar las ya mostradas
const countSiteExtras = (sitePayload, shownUrls) => {
  const rows = (sitePayload && Array.isArray(sitePayload.pegas)) ? sitePayload.pegas : []
  const shown = new Set((shownUrls || []).map(normalizeUrl))
  const overlaps = rows.filter((row) => row && row.url && shown.has(normalizeUrl(row.url))).length
  const total = Number(sitePayload && sitePayload.total)
  const totalSafe = Number.isFinite(total) ? total : rows.length
  return Math.max(0, totalSafe - overlaps)
}

const parseSitePayload = (body) => {
  const parsed = JSON.parse(body)
  return (parsed && Array.isArray(parsed.pegas)) ? parsed : { total: 0, pegas: [] }
}

const formatSitePegaDetail = (pega) => [
  [pega.empleador, pega.ubicacion, pega.sueldo].filter(Boolean).join(' · '),
  [pega.categoria, pega.fuente].filter(Boolean).join(' · ')
].filter(Boolean).join('\n')

const buildGoldBlocks = (sitePegas, searchTerm) => {
  if (!sitePegas.length) {
    return [
      section(text(`No hay trabajos encontrados en <${siteApiHost}|pegas.devschile.cl> para '${searchTerm}'`, TEXT_FORMAT_MRKDWN))
    ]
  }
  const blocks = [
    section(text(`*Mostrando ${sitePegas.length} trabajos para '${searchTerm}' en <${siteSearchUrl(searchTerm)}|pegas.devschile.cl>*`, TEXT_FORMAT_MRKDWN))
  ]
  for (const pega of sitePegas) {
    blocks.push(
      context([
        text(`<${pega.url}|${pega.titulo}>\n${formatSitePegaDetail(pega)}`, TEXT_FORMAT_MRKDWN)
      ])
    )
  }
  blocks.push(
    section(text(`Para ver todos en <${siteSearchUrl(searchTerm)}|pegas.devschile.cl/?q=${searchTerm}>`, TEXT_FORMAT_MRKDWN))
  )
  return blocks
}

module.exports = function (robot, web = webClient) {
  const imageAssetHost = process.env.HUBOT_URL

  const remoteLabels = {
    no_remote: 'No remoto',
    temporarily_remote: 'Temporalmente remoto',
    remote_local: zone => `Remoto dentro de ${zone}`,
    fully_remote: 'Full Remoto'
  }
  const sendMessage = (message, channel, options = {}) => {
    const { unfurl = true, fallbackText = '*GetOnBrd*' } = options
    let data
    if (!Array.isArray(message)) {
      data = {
        channel,
        text: message
      }
    } else {
      data = {
        channel,
        blocks: message,
        text: fallbackText
      }
    }
    if (!unfurl) {
      data.unfurl_links = false
      data.unfurl_media = false
    }
    return web.chat.postMessage({
      ...data,
      token
    })
  }
  const deleteMessage = (message) => {
    if (message !== undefined) {
      const { channel, message: { ts } } = message
      web.chat.delete({
        token,
        channel,
        ts
      })
    }
  }
  const getBody = (uri, options = {}) => {
    return new Promise((resolve, reject) => {
      const request = robot.http(uri)
      if (options.headers) request.headers(options.headers)
      if (options.query) request.query(options.query)
      if (options.timeoutMs) request.timeout(options.timeoutMs)
      request.get()((err, res, body) => {
        if (err) {
          return reject(err)
        }
        if (res.statusCode !== 200) {
          return reject(new Error(`HTTP ${res.statusCode} en ${uri}`))
        }
        resolve(body)
      })
    })
  }
  const formatAmountToUsd = (amount) => {
    if (parseInt(amount)) {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0, currencyDisplay: 'code' }).format(amount)
    }
    return 'US$0'
  }
  const mapResponseToJobs = (response) => {
    let jobs = []
    const { data } = response
    if (data) {
      jobs = data.map(dataRow => {
        if (dataRow.type === 'job') {
          const {
            applications_count: applicationsCount,
            company: {
              data: {
                attributes: {
                  name: companyName,
                  logo: companyLogo
                }
              }
            },
            min_salary: minSalary,
            max_salary: maxSalary,
            perks,
            remote_modality: remoteModality,
            remote_zone: remoteZone,
            title
          } = dataRow.attributes
          const { public_url: publicUrl } = dataRow.links
          return {
            applicationsCount: applicationsCount || 0,
            companyName,
            companyLogo,
            minSalary,
            maxSalary,
            remoteModality,
            remoteZone,
            perks,
            publicUrl,
            title
          }
        }
      })
    }
    return jobs
  }
  const formatPerkLabel = (perk) => {
    return perk.replace(/_/g, ' ').replace(/\w+/g,
      function (w) { return w[0].toUpperCase() + w.slice(1).toLowerCase() })
  }
  const buildCondensedJobsBlock = async (jobs) => {
    const blocks = []
    for (const job of jobs) {
      const {
        companyName,
        companyLogo,
        title,
        remoteModality,
        remoteZone,
        minSalary,
        maxSalary,
        publicUrl
      } = job

      blocks.push(
        context([
          image(companyLogo, companyName),
          text(`<${publicUrl}|${companyName} - ${title}>`, TEXT_FORMAT_MRKDWN),
          text(`${maxSalary > 0 ? `${formatAmountToUsd(minSalary)} - ${formatAmountToUsd(maxSalary)}` : 'No especifica'}`, TEXT_FORMAT_MRKDWN),
          text(`${remoteModality === 'remote_local' ? remoteLabels.remote_local(remoteZone) : remoteLabels[remoteModality] || 'No especifica'}`, TEXT_FORMAT_MRKDWN)
        ])
      )
    }
    return blocks
  }
  const buildJobsBlock = async (jobs) => {
    const blocks = []
    for (const job of jobs) {
      const {
        title,
        applicationsCount,
        companyName,
        companyLogo,
        remoteModality,
        remoteZone,
        perks,
        minSalary,
        maxSalary,
        publicUrl
      } = job
      blocks.push(
        context([
          image(companyLogo, companyName),
          text(`<${publicUrl}|${companyName} - ${title}>`, TEXT_FORMAT_MRKDWN)
        ])
      )
      blocks.push(
        context([
          text(`*Rango Salarial*: ${maxSalary > 0 ? `${formatAmountToUsd(minSalary)} - ${formatAmountToUsd(maxSalary)}` : 'No especifica'}`, TEXT_FORMAT_MRKDWN)
        ])
      )
      blocks.push(
        context([
          text(`*Remoto*: ${remoteModality === 'remote_local' ? remoteLabels.remote_local(remoteZone) : remoteLabels[remoteModality] || 'No especifica'}`, TEXT_FORMAT_MRKDWN)
        ])
      )
      blocks.push(
        context([
          text(`*Aplicaciones recibidas*: ${applicationsCount}`, TEXT_FORMAT_MRKDWN)
        ])
      )
      // Perks are limited to 10 by Slack Block API limitations.
      blocks.push(
        context([
          text('*Beneficios*', TEXT_FORMAT_MRKDWN),
          ...perks.slice(0, 9).map(perk => image(`${imageAssetHost}/images/getonbrd-icons/${perk}.gif`, formatPerkLabel(perk)))
        ])
      )
      if (perks.length > 9) {
        context([text(`${perks.length > 9 ? `...y ${perks.length - 9} más` : ''}`, TEXT_FORMAT_MRKDWN)])
      }
      blocks.push(divider())
    }
    return blocks
  }
  robot.respond(/(pega|pegas|trabajo|trabajos) (.*)/i, async function (msg) {
    const tldrModeLimit = 10
    const expandedModeLimit = 3
    const { term, gold } = extractSearchFlags(msg.match[2] || '')
    let searchTerm = term
    const searchUrl = encodeURI(`${gobDomain}/jobs-${searchTerm}`)
    const formatSearchApiUrl = (searchTerm, limit) => encodeURI(`${gobApiHost}/search/jobs?query=${searchTerm}&per_page=${limit}&expand=["company"]`)
    if (searchTerm.match(/^(help|ayuda)$/g)) {
      const blocks = []
      blocks.push(JSON.parse(`{
        "type": "header",
        "text": {
          "type": "plain_text",
          "text": "Búsqueda de trabajo - Powered by GetOnBrd API"
        }
      }`))
      blocks.push(divider())
      blocks.push(section(
        text(`
*huemul <pega|pegas|trabajo|trabajos> <busqueda>* - Retorna 3 búsquedas con detalles de trabajo (Rango Salarial, Remoto, Aplicaciones recibidas y  beneficios)
*huemul <pega|pegas|trabajo|trabajos> <tldr|mini|short|corta> <busqueda>* - Retorna 10 resultados de trabajos con detalles condensados (Rango Salarial, Remoto)
*huemul <pega|pegas|trabajo|trabajos> --gold <busqueda>* - Retorna los 3 trabajos más nuevos en pegas.devschile.cl, la vitrina con más fuentes (LinkedIn, Himalayas, Jobicy y WorkingNomads)
*huemul <help|ayuda>* - Muestra este mensaje
        `, TEXT_FORMAT_MRKDWN)
      ))
      return sendMessage(blocks, msg.message.room)
    }
    if (gold && !searchTerm) {
      return sendMessage([section(text('¿Qué buscas? Prueba con `huemul pegas --gold backend`.', TEXT_FORMAT_MRKDWN))], msg.message.room)
    }
    const timeoutMs = Number(process.env.HUBOT_PEGAS_TIMEOUT_MS) || DEFAULT_TIMEOUT_MS
    const loadingMessage = await sendMessage(gold ? 'Buscando en pegas.devschile.cl... :dev:' : 'Buscando en GetOnBrd... :dev:', msg.message.room)

    try {
      const tldrRegex = /(tldr|mini|short|corta) (?!$)/g
      let isShortVersion = false
      if (searchTerm.match(tldrRegex) !== null) {
        isShortVersion = true
        searchTerm = searchTerm.replace(tldrRegex, '')
      }

      if (gold) {
        if (!searchTerm) {
          return sendMessage([section(text('¿Qué buscas? Prueba con `huemul pegas --gold backend`.', TEXT_FORMAT_MRKDWN))], msg.message.room)
        }
        const body = await getBody(siteListUrl(searchTerm, GOLD_RESULTS), { timeoutMs })
        const sitePegas = parseSitePayload(body).pegas.slice(0, GOLD_RESULTS)
        sendMessage(buildGoldBlocks(sitePegas, searchTerm), msg.message.room, { unfurl: false, fallbackText: '*pegas.devschile.cl*' })
        return
      }

      const body = await getBody(formatSearchApiUrl(searchTerm, isShortVersion ? tldrModeLimit : expandedModeLimit), { timeoutMs })
      const jobs = mapResponseToJobs(JSON.parse(body))

      // Cuántas pegas más hay en pegas.devschile.cl (best-effort: si falla,
      // se mantiene el pie de GetOnBrd de siempre).
      let extras = null
      if (searchTerm) {
        try {
          const siteBody = await getBody(siteListUrl(searchTerm, SITE_FETCH_LIMIT), { timeoutMs })
          extras = countSiteExtras(parseSitePayload(siteBody), jobs.map(job => job.publicUrl))
        } catch (e) {
          extras = null
        }
      }

      if (jobs.length === 0) {
        const blocks = [
          section(text(`No hay trabajos encontrados en <${gobDomain}|GetOnBrd> para '${searchTerm}'`, TEXT_FORMAT_MRKDWN))
        ]
        if (extras > 0) {
          blocks.push(
            context([
              text(`Hay ${extras} pegas más en <${siteSearchUrl(searchTerm)}|pegas.devschile.cl> usando el flag --gold`, TEXT_FORMAT_MRKDWN)
            ])
          )
        }
        return sendMessage(blocks, msg.message.room)
      }

      const blocks = [
        section(text(`*Mostrando ${jobs.length} trabajos para '${searchTerm}' en <${searchUrl}|getonbrd>*`, TEXT_FORMAT_MRKDWN))
      ]
      let jobsBlock
      if (isShortVersion) {
        jobsBlock = await buildCondensedJobsBlock(jobs)
      } else {
        jobsBlock = await buildJobsBlock(jobs)
      }
      blocks.push(...jobsBlock)
      if (extras > 0) {
        blocks.push(section(text(`Hay ${extras} pegas más usando el flag --gold`, TEXT_FORMAT_MRKDWN)))
      } else {
        blocks.push(section(text(`Para ver más resultados, visita <${searchUrl}|GetOnBrd - ${searchTerm}>`, TEXT_FORMAT_MRKDWN)))
      }
      sendMessage(blocks, msg.message.room)
    } catch (e) {
      if (gold) {
        sendMessage([section(text(`😱 Ups! No se pudo consultar pegas.devschile.cl para '${searchTerm}'`, TEXT_FORMAT_MRKDWN))], msg.message.room)
      } else {
        robot.emit('error', e, 'pegas')
      }
    } finally {
      loadingMessage && deleteMessage(loadingMessage)
    }
  })
}

module.exports._test = {
  extractSearchFlags,
  normalizeUrl,
  countSiteExtras,
  parseSitePayload,
  buildGoldBlocks
}
