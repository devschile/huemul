// Description:
//   Get available products from Neeks
//
//  Dependencies:
//    cheerio
//
// Commands:
//   hubot neeks <product_name> - Get available products from Neeks
//
// Author:
//   @hectorpalmatellez
//   @jorgeepunan

const cheerio = require('cheerio')

module.exports = function (robot) {
  robot.respond(/neeks (.*)/i, async function (msg) {
    const sendResults = (results = []) => {
      if (results.length > 0) {
        const text = results.join('\n')
        if (robot.adapter.constructor.name === 'SlackBot') {
          const options = { unfurl_links: false, as_user: true }
          robot.adapter.client.web.chat.postMessage(msg.message.room, text, options)
        } else {
          msg.send(text)
        }
      } else {
        msg.send('No hay de lo que buscas, alégale a :pinceleart:')
      }
    }
    const search = msg.match[1]
    const mainUrl = 'https://neeks.cl/'
    const url = mainUrl + '?s=' + search.replace(' ', '+') + '&post_type=product'
    msg.send(':joystick: buscando ' + search + '...')
    robot.http(url).get()(function (err, res, body) {
      if (err !== null) {
        robot.emit('error', err || new Error(`Status code is ${res.statusCode}`), msg, 'neeks')
        msg.reply(':pinceleart: mató al animal')
        return
      }
      const $ = cheerio.load(body)
      if (res.statusCode === 302) {
        robot.http(res.headers.location).get()(function (err, res2, body2) {
          const results = []
          if (err !== null) {
            robot.emit('error', err || new Error(`Status code is ${res2.statusCode}`), msg, 'neeks')
            msg.reply(':pinceleart: mató al animal')
          }
          const $2 = cheerio.load(body2)
          const $productName = $2('h1.product_title.entry-title').text()
          const $productUrl = res.headers.location
          const $productPrice = $2('.wds-price').first().text().trim()
          results.push(' - ' + $productName + ': ' + '_' + $productPrice + '_\n  ' + $productUrl)
          sendResults(results)
        })
      } else {
        const results = []
        $('.badge.out-of-stock ').parents('.product-type-simple').addClass('no')

        $('.product-type-simple:not(.no)').each(function () {
          const $productName = $(this).find('.woocommerce-loop-product__title a').text()
          const $productUrl = $(this).find('.woocommerce-loop-product__title a').attr('href')
          const $productPrice = $(this).find('.woocommerce-Price-amount.amount bdi').text().trim()
          results.push(' - ' + $productName + ': ' + '_' + $productPrice + '_\n  ' + $productUrl)
        })
        sendResults(results)
      }
    })
  })
}
