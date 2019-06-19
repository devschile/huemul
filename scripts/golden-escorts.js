// Description:
//   Hubot script exclusivo para usuarios devsChile golden :monea: que encuentra escorts en Santiago, Chile
//
//  Dependencies:
//    cheerio
//    numberToCLPFormater
//
// Commands:
//   hubot escorts - Muestra todas las escorts en Santiago, Chile
//   hubot escorts vip - Muestra escorts vip en Santiago, Chile
//   hubot escorts premium - Muestra escorts premium en Santiago, Chile
//   hubot escorts gold - Muestra escorts gold en Santiago, Chile
//
// Author:
//   @jorgeepunan

var cheerio = require('cheerio')
var number = require('numbertoclpformater').numberToCLPFormater

module.exports = function(robot) {
  robot.respond(/escorts(.*)/i, function(msg) {
    if (robot.golden.isGold(msg.message.user.name)) {
      var baseURL = 'http://www.sexo.cl'
      var tipoWasha = msg.match[1].split(' ')[1]
      var url = ''
      var tipo = ''
      var urlVip = '/?id=995&categ=1624'
      var urlPremium = '/?id=995&categ=553'
      var urlGold = '/?id=995&categ=554'
      var urlDefault = '/?id=996&bTodas=1'

      switch (tipoWasha) {
        case 'vip':
          url = baseURL + urlVip
          break
        case 'premium':
          url = baseURL + urlPremium
          break
        case 'gold':
          url = baseURL + urlGold
          break
        default:
          url = baseURL + urlDefault
          tipo = 'Todas las Escort / All Girls'
      }

      robot.messageRoom('#nsfw', 'Buscando en sexo.cl chicas para ti :monea: ')

      robot.http(url).get()(function(err, res, body) {
        var $ = cheerio.load(body)
        tipo = $('#subtCate').text()
        var resultados = []

        $('#ColDer ul li').each(function() {
          var nombre = $(this)
            .find('h2 > a')
            .text()
          var link = $(this)
            .find('a[target="_blank"]')
            .attr('href')
          var descr = $(this)
            .find('p')
            .text()
          var precio = number($(this).attr('data-valor'))

          resultados.push(`<${baseURL}${link}|${nombre} ${descr} (${precio})>`)
        })

        if (resultados.length > 0) {
          var limiteResultados = resultados.length > 10 ? 5 : resultados.length
          var plural = resultados.length > 1 ? ['n', 's'] : ['', '']
          var resume = 'Se ha' + plural[0] + ' encontrado ' + resultados.length + ' washa' + plural[1] + ':'
          var links = resultados
            .slice(0, limiteResultados)
            .map((result, index) => `${index + 1}: ${result}`)
            .join('\n')
          var more = resultados.length > limiteResultados ? `\n<${baseURL}|Ver más resultados>` : ''
          var text = `${resume}\n${links}${more}`
          robot.messageRoom('#nsfw', tipo)
          if (robot.adapter.constructor.name === 'SlackBot') {
            var options = { unfurl_links: false, as_user: true }
            msg.send('Resultados de escorts encontradas se postearon en #nsfw :eyes:')
            robot.adapter.client.web.chat.postMessage('#nsfw', text, options)
          } else {
            robot.messageRoom('#nsfw', text)
          }
        } else {
          robot.messageRoom('#nsfw', 'No se han encontrado chicas :monea: intenta otra vez.')
        }
      })
    } else {
      msg.send(
        'Esta funcionalidad es exclusiva para socios golden :monea: de devsChile. Dona en www.devschile.cl para unirte.'
      )
    }
  })
}
