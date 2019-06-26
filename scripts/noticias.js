// Description:
//  Muestra noticias para la búsqueda seleccionada desde Ahora Noticias Chile
//
// Dependencies:
//  moment, cheerio
//
// Commands:
//  hubot noticias <query> - Muestra noticias para la búsqueda seleccionada desde Ahora Noticias Chile
//
// Author:
//  @jlobitu

const moment = require('moment')
const querystring = require('querystring')
const cheerio = require('cheerio')

module.exports = robot =>
  robot.respond(/noticias (.*)/i, msg => {
    const send = text => {
      if (robot.adapter.constructor.name === 'SlackBot') {
        const options = { unfurl_links: false, as_user: true }
        robot.adapter.client.web.chat.postMessage(msg.message.room, text, options)
      } else {
        msg.send(text)
      }
    }
    const q = msg.match[1]
    robot
      .http('http://www.ahoranoticias.cl/buscador/')
      .header('Origin', 'http://www.ahoranoticias.cl')
      .header('Accept-Language', 'es-419,es;q=0.9')
      .header('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8')
      .header('Accept', 'text/html, */*; q=0.01')
      .header('Cache-Control', 'no-cache')
      .header('X-Requested-With', 'XMLHttpRequest')
      .header('Referer', 'http://www.ahoranoticias.cl/home/')
      .post(querystring.stringify({ q, ajax: true }))((err, res, body) => {
      if (err) {
        robot.emit('error', err, msg, 'noticias')
      } else {
        const $ = cheerio.load(body)
        const results = $('.item')
          .map((i, el) => {
            const url = $(el).find('.l a').attr('href')
            const title = $(el).find('.r h2').text()
            const date = $(el).find('.r span').text()
            if (!url || !title || !date) return null
            return `${i + 1}: <${url}|${title}> (${moment(date, 'DD/MM/YYYY').fromNow()})`
          })
          .get()
          .filter(x => x !== null)
        const news = results.length > 0 ? results.join('\n') : null

        const head = ':huemul: *News*'

        if (news) {
          send(`${head}\n${news}\n<http://www.ahoranoticias.cl/buscador/|Sigue buscando en ahoranoticias.cl>`)
        } else {
          send(`${head}\nNo se han encontrado noticias sobre *${q}*.`)
        }
      }
    })
  })
