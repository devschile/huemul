// Description:
//   Busca pegas recientes en GetOnBrd
//
//  Dependencies:
//    cheerio
//
// Commands:
//   hubot pega|pegas|trabajo|trabajos <oficio> - Busca pegas recientes para el oficio seleccionado en GetOnBrd
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

module.exports = function (robot, web = webClient) {
  const imageAssetHost = process.env.HUBOT_URL

  const remoteLabels = {
    no_remote: 'No remoto',
    temporarily_remote: 'Temporalmente remoto',
    remote_local: zone => `Remoto dentro de ${zone}`,
    fully_remote: 'Full Remoto'
  }
  const sendMessage = (message, channel) => {
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
        text: '*GetOnBrd*'
      }
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
      request.get()((err, res, body) => {
        if (err) {
          return reject(err)
        }
        if (res.statusCode !== 200) {
          return reject(err)
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
    let searchTerm = msg.match[2] || ''
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
*huemul <help|ayuda>* - Muestra este mensaje
        `, TEXT_FORMAT_MRKDWN)
      ))
      return sendMessage(blocks, msg.message.room)
    }
    const loadingMessage = await sendMessage('Buscando en GetOnBrd... :dev:', msg.message.room)

    try {
      const tldrRegex = /(tldr|mini|short|corta) (?!$)/g
      let isShortVersion = false
      if (searchTerm.match(tldrRegex) !== null) {
        isShortVersion = true
        searchTerm = searchTerm.replace(tldrRegex, '')
      }
      const body = await getBody(formatSearchApiUrl(searchTerm, isShortVersion ? tldrModeLimit : expandedModeLimit))
      const jobs = mapResponseToJobs(JSON.parse(body))
      if (jobs.length === 0) {
        const blocks = [
          section(text(`No hay trabajos encontrados en <${gobDomain}|GetOnBrd> para '${searchTerm}'`, TEXT_FORMAT_MRKDWN))
        ]
        loadingMessage && deleteMessage(loadingMessage)
        return sendMessage(blocks, msg.message.room)
      }
      const blocks = [
        JSON.parse(`{
          "type": "header",
          "text": {
            "type": "plain_text",
            "text": "Mostrando ${jobs.length} trabajos para '${searchTerm}'"
          }
        }`)
      ]
      let jobsBlock
      if (isShortVersion) {
        jobsBlock = await buildCondensedJobsBlock(jobs)
      } else {
        jobsBlock = await buildJobsBlock(jobs)
      }

      blocks.push(...jobsBlock)
      blocks.push(section(text(`Para ver más resultados, visita <${searchUrl}|GetOnBrd - ${searchTerm}>`, TEXT_FORMAT_MRKDWN)))
      sendMessage(blocks, msg.message.room)
    } catch (e) {
      robot.emit('error', e, 'pegas')
    }
    loadingMessage && deleteMessage(loadingMessage)
  })
}
