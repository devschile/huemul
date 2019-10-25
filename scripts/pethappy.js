// Description:
//   Get available products from PetHappy
//
//  Dependencies:
//    cheerio
//
// Commands:
//   hubot pethappy <producto> - Get available products from PetHappy
//
// Author:
//   @hectorpalmatellez

var cheerio = require('cheerio')

module.exports = function (robot) {
  robot.respond(/pethappy (.*)/i, function (msg) {
    msg.send(':perro: buscando...')

    var search = msg.match[1]
    var mainUrl = 'https://www.pethappy.cl'
    var url = mainUrl + '/search/' + search.replace(' ', '%20')

    robot.http(url).get()(function (err, res, body) {
      if (err || res.statusCode !== 200) {
        robot.emit('error', err || new Error(`Status code is ${res.statusCode}`), msg, 'pethappy')
        msg.reply(':happyto: mato el server, preguntar por INBOX a :pinceleart:')
        return
      }
      var $ = cheerio.load(body)
      var results = []

      $('.nodisponible').parents('.producto-box').addClass('no')

      $('.producto-box:not(.no)').each(function () {
        var $productName = $(this).find('h1 a').text()
        var $productUrl = $(this).find('.comprar a').attr('href')
        var $productPrice = $(this).find('.precio').text().trim()
        results.push(' - ' + $productName + ': ' + '_' + $productPrice + '_\n  ' + mainUrl + $productUrl)
      })

      if (results.length > 0) {
        var text = results.join('\n')

        if (robot.adapter.constructor.name === 'SlackBot') {
          var options = { unfurl_links: false, as_user: true }
          robot.adapter.client.web.chat.postMessage(msg.message.room, text, options)
        } else {
          msg.send(text)
        }
      } else {
        msg.send('No hay de lo que buscas, habla con :pinceleart:')
      }
    })
  })
}
