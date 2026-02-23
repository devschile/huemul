// Description:
//   Busca productos en Knasta.cl
//
//  Dependencies:
//    q
//    cheerio
//
// Commands:
//   hubot knasta <producto> - Busca el producto en Knasta.cl
//
// Author:
//   @jorgeepunan

var cheerio = require('cheerio')

module.exports = function (robot) {
  robot.respond(/knasta (.*)/i, function (msg) {
    msg.send('Buscando en Knasta... :gift:')

    var busqueda = msg.match[1]
    var domain = 'https://knasta.cl/results/'
    var url = domain + encodeURIComponent(busqueda)

    robot.http(url).get()((error, response, body) => {
      if (error) {
        return robot.emit('error', error, msg, 'knasta')
      }

      if (!response || response.statusCode >= 400) {
        return msg.send('No se han encontrado resultados sobre _' + busqueda + '_')
      }

      try {
        var $ = cheerio.load(body)
        var resultados = []

        if (!$('.fa-meh-o').length) {
          $('.item.panel.panel-default').each(function () {
            var title = $(this)
              .find('.title')
              .text()
              .trim()
            var price = $(this)
              .find('.item-price')
              .text()
              .trim()
            var discount = $(this)
              .find('.perc.minus')
              .text()
              .trim()
            var href = $(this)
              .find('a')
              .attr('href')
            var link = href ? 'https://knasta.cl' + href : url

            resultados.push('<' + link + '|' + title + ': ' + price + ' (' + discount + ')>')
          })
        }

        if (resultados.length > 0) {
          var limiteResultados = resultados.length > 4 ? 3 : resultados.length
          var plural = resultados.length > 1 ? ['n', 's'] : ['', '']
          var text = 'Se ha' + plural[0] + ' encontrado ' + resultados.length + ' resultado' + plural[1] + '\n'
          for (var i = 0; i < limiteResultados; i++) {
            var conteo = i + 1
            text += conteo + ': ' + resultados[i] + '\n'
          }
          if (resultados.length > limiteResultados) {
            text += 'Otros resultados en: *<' + url + '|knasta>*\n'
          }

          var options = { unfurl_links: false, as_user: true }
          robot.adapter.client.web.chat.postMessage(msg.message.room, text, options)
        } else {
          msg.send('No se han encontrado resultados sobre _' + busqueda + '_')
        }
      } catch (e) {
        robot.emit('error', e, msg, 'knasta')
      }
    })
  })
}
