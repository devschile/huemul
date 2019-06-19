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
const link = 'https://awesome.devschile.cl/'

/**
 * @param {string} markdown
 * @returns {string}
 */
const parseMarkdownLinks = markdown => {
  return markdown.split('\n').reduce((text, line) => {
    const match = /^- \[(.+)\]\((http.+)\): (.+)/.exec(line)
    if (match) {
      text += `- <${match[2]}|${match[1]}>: ${match[3]}\n`
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
function findVal(jsonMarkdown, channel) {
  const result = Object.entries(jsonMarkdown['Awesome devsChile']).find(([key, _]) => key === channel)
  if (!result) return
  return result[1]
}

module.exports = function(robot) {
  robot.respond(/awesome (\w+)/i, res => {
    const channel = `#${res.match[1]}`

    robot.http(file).get()(function(error, response, body) {
      if (!error && response.statusCode == 200) {
        const markdown = body
        const jsonifyed = md2json.parse(markdown)
        const findChannelContent = findVal(jsonifyed, channel)

        if (findChannelContent) {
          res.send(
            `En Awesome devsChile para *${channel}* tenemos los siguientes links:\n\r${parseMarkdownLinks(
              findChannelContent.raw
            )}\n\rTodo el detalle en: <${link}|Awesome devsChile>`
          )
        } else {
          res.send(`¿Ayuda? Comando: \`huemul awesome <nombrecanal>\``)
        }
      }
    })
  })
}
