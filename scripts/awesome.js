// Description:
//  Huemul muestra los links en awesome.devschile.cl según canal
//
// Dependencies:
//   md-2-json
//
// Configuration:
//   None
//
// Commands:
//   hubot awesome <nombrecanal> - Retorna los enlaces `awesome` de un canal. Ejemplo: `hubot awesome backend`
//
// Author:
//   @jorgeepunan

const md2json = require('md-2-json')

const file = 'https://raw.githubusercontent.com/devschile/awesome-devschile/master/README.md'

/**
 * @param {string} title
 * @param {string} link
 * @param {string} description
 * @returns {string}
 */
const mdToFallbackText = (title, link, description) => {
  return `- ${title} (${link}): ${description}\n`
}

/**
 * @param {string} title
 * @param {string} link
 * @param {string} description
 * @returns {string}
 */
const mdToAttachmentText = (title, link, description) => {
  return `<${link}|${title}>: ${description}\n`
}

/**
 * @param {string} markdown
 * @returns {string}
 */
const parseMarkdownLinks = (markdown, fallback = false) => {
  const parser = fallback ? mdToFallbackText : mdToAttachmentText
  return markdown.split('\n').reduce((text, line) => {
    const match = /^- \[(.+)\]\((http.+)\): (.+)/.exec(line)
    if (match) {
      text += parser(match[1], match[2], match[3])
    } else {
      text += `${line}\n`
    }
    return text
  }, '')
}

/**
 * @param {Object} jsonMarkdown
 * @param {string} channel
 * @returns {Object}
 */
function findVal (jsonMarkdown, channel) {
  const result = Object.entries(jsonMarkdown['Awesome devsChile']).find(([key]) => key === channel)
  if (!result) return
  return result[1]
}

module.exports = function (robot) {
  robot.respond(/awesome(\s+\w+)?/i, res => {
    const send = (markdown, channel) => {
      const awesomeLink = 'https://awesome.devschile.cl/'
      const awesomeTitle = 'Awesome devsChile'
      const fallbackText = parseMarkdownLinks(markdown, true)
      const text = parseMarkdownLinks(markdown)
      const fallback = `En ${awesomeTitle} para ${channel} tenemos los siguientes links:\n${fallbackText}Todo el detalle en: ${awesomeLink}`
      if (['SlackBot', 'Room'].includes(robot.adapter.constructor.name)) {
        const options = {
          as_user: false,
          link_names: 1,
          icon_url: 'https://i.imgur.com/8NL6mb1.png',
          username: 'Awesome',
          unfurl_links: false,
          attachments: [
            {
              fallback,
              text,
              title: `${awesomeTitle} ${channel}`,
              title_link: awesomeLink
            }
          ]
        }
        robot.adapter.client.web.chat.postMessage(res.message.room, null, options)
      } else {
        res.send(fallback)
      }
    }

    let channel
    if (res.match[1]) {
      channel = `#${res.match[1].trim()}`
    } else {
      const _channel = robot.adapter.client.rtm.dataStore.getChannelGroupOrDMById(res.message.room)
      channel = _channel && _channel.name
    }

    robot.http(file).get()((err, response, body) => {
      if (err) {
        robot.emit('error', err, res, 'awesome')
        robot.emit('slack.ephemeral', 'Ocurrio un error al hacer la busqueda', res.message.room, res.message.user.id)
      } else if (response.statusCode !== 200) {
        robot.emit('slack.ephemeral', 'Ocurrio un error al hacer la busqueda', res.message.room, res.message.user.id)
      } else {
        const markdown = body
        const jsonifyed = md2json.parse(markdown)
        const findChannelContent = findVal(jsonifyed, channel)
        if (!findChannelContent) {
          return robot.emit('slack.ephemeral', 'Canal desconocido', res.message.room, res.message.user.id)
        }
        send(findChannelContent.raw, channel)
      }
    })
  })
}
