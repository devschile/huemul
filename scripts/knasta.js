// Description:
//   Busca productos en Knasta.cl
//
//  Dependencies:
//    phantom
//    q
//    cheerio
//
// Commands:
//   hubot knasta <producto> - Busca el producto en Knasta.cl
//
// Author:
//   @jorgeepunan

var phantom = require('phantom')
var cheerio = require('cheerio')
var _ph, _page, _outObj

function textPopulated() {
  return _page
    .evaluate(function() {
      return document.querySelector('#app').outerHTML
    })
    .then(function(html) {
      return html
    })
}

function waitState(state, timeout) {
  // timeout in seconds is optional

  var limitTime = timeout * 1000 || 20000
  var startTime = new Date()
  const sleep = m => new Promise(resolve => setTimeout(() => resolve(), m))

  return wait()

  function wait() {
    return state()
      .then(function(result) {
        if (result) {
          return
        } else if (new Date() - startTime > limitTime) {
          var errorMessage = 'Timeout state: ' + state.name
          throw new Error(errorMessage)
        } else {
          return sleep(50).then(wait)
        }
      })
      .catch(function(error) {
        throw error
      })
  }
}

module.exports = function(robot) {
  robot.respond(/knasta (.*)/i, function(msg) {
    msg.send('Buscando en Knasta... :gift:')

    var busqueda = msg.match[1]
    var domain = 'http://knasta.cl/results/'
    var url = domain + busqueda.split(' ').join('%20')

    robot.http(url).get()(function(err, res, body) {
      phantom
        .create()
        .then(ph => {
          _ph = ph
          return _ph.createPage()
        })
        .then(page => {
          _page = page
          return _page.open(url)
        })
        .then(status => {
          return waitState(textPopulated, 3)
        })
        .then(() => {
          return _page.property('content')
        })
        .then(content => {
          var $ = cheerio.load(content)
          var resultados = []

          if (!$('.fa-meh-o').length) {
            $('.item.panel.panel-default').each(function() {
              var title = $(this)
                .find('.title')
                .text()
              var price = $(this)
                .find('.item-price')
                .text()
              var discount = $(this)
                .find('.perc.minus')
                .text()
              var link =
                'http://knasta.cl' +
                $(this)
                  .find('a')
                  .attr('href')

              resultados.push('<' + link + '|' + title + ': ' + price + ' (' + discount + ')>')
            })

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

              //msg.send(text); // test local, descomentar y comentar las siguientes 2 líneas
              var options = { unfurl_links: false, as_user: true }
              robot.adapter.client.web.chat.postMessage(msg.message.room, text, options)
            } else {
              msg.send('No se han encontrado resultados sobre _' + busqueda + '_')
            }
          } else {
            msg.send('No se han encontrado resultados sobre _' + busqueda + '_')
          }

          _page.close()
          _ph.exit()
        })
        .catch(e => robot.emit('error', e, msg, 'knasta'))
    })
  })
}
