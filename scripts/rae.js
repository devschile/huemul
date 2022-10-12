// Description:
//  Devuelve una definición de la palabra desde la página de la Real Academia Española (RAE)
//
// Commands:
//  hubot rae|define <palabra>
//
// Author:
//  @fskarmeta

  
const cheerio = require('cheerio')
const fetch = require('node-fetch')
const querystring = require('querystring')

module.exports = function (robot) {
  robot.respond(/(rae|define) (\s*[a-zA-ZÀ-ÿ]*)(\s*[a-zA-ZÀ-ÿ]*)/i, function (msg) {
    const word = msg.match[3] ? msg.match[2].trim() + msg.match[3].trim() : msg.match[2].trim()
    const search = querystring.escape(word.toLowerCase())
    const url = 'http://dle.rae.es/srv/search?w='
    const fetchQuery = url + search
    fetch(fetchQuery)
    .then(res => res.text())
    .then(text => {
        const $ = cheerio.load(text)
        const definition = $('meta[name="description"]').attr('content')
        if (definition.split(" ")[0] === "Versión") {
            msg.send("No se encontró aquella palabra :sadhuemul:")
        } else {
            msg.send(definition)
        }
    }).catch(e => msg.send("Ohh no, algo no está funcionando bien. ¿Conocen algún programador que pueda ver esto? :huemul-patitas:"))
  })
  
}
