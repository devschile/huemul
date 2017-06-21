// Description:
//   Obtiene el valor de un sitio usando su URL a través de worthofweb.com
//
//  Dependencies:
//    cheerio
//    cloudscraper
//
// Commands:
//   hubot cu(a|á)ntovale [url sin http:// ni www.]
//
// Author:
//   @juanbrujo

const cheerio = require('cheerio')
const fetch = require('cloudscraper')

module.exports = robot => {
  robot.respond(/cu(a|á)ntovale (.*)/i, msg => {
    msg.send(':timer_clock: buscando...')

    const site = msg.match[2]
    const url = `http://www.worthofweb.com/website-value/${site}`

    fetch.get(url, (err, res, body) => {
      if (err || res.statusCode !== 200) {
        return robot.emit('error', err || new Error(`Status code ${res.statusCode}`), msg)
      }

      const $ = cheerio.load(body)

      if ($('.fa-bell').length) {
        msg.send('Este sitio no existe. Intenta con otro.')
      } else {
        msg.send(':monea: ' + $('title').text().trim().split(' - ')[0])
      }
    })
  })
}
