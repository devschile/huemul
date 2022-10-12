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
//   @dilip

const cheerio = require('cheerio')
const { block, object, element, TEXT_FORMAT_MRKDWN, TEXT_FORMAT_PLAIN } = require('slack-block-kit')
const {
  button
} = element
const { WebClient } = require('@slack/web-api')
const token = process.env.HUBOT_SLACK_TOKEN
const web = new WebClient(token)
const { text } = object
const { section, divider, image } = block
const storeHost = 'https://neeks.cl/'
const productLimit = 5
module.exports = function (robot) {
  robot.respond(/neeks (.*)/i, async function (msg) {
    const buildAndSendBlockMessage = (searchTerm, results) => {
      const header = section(
        text(`*Buscando '${searchTerm}' en Neeks.cl 🚀*\n${results.length > 0 ? `Mostrando ${results.length} ${results.length > 1 ? 'resultados' : 'resultado'}` : ''}`, TEXT_FORMAT_MRKDWN)
      )
      const channel = msg.message.room
      const calculatePriceWithDiscount = (price, discount) => {
        if (discount === 0) {
          return price
        }
        const discountedPrice = (1 - (discount / 100)) * price
        return `$${new Intl.NumberFormat('es-CL').format(Math.floor(discountedPrice))}`
      }
      const blocks = [header, divider()]
      if (results.length === 0) {
        blocks.push(section(text('No se encontraron resultados')))
        return web.chat.postMessage({
          channel,
          blocks: blocks,
          text: '*Neeks.cl*'
        })
      }
      results.forEach(result => {
        const actionId = `neeks_${result.name}`
        const intPrice = parseInt(result.price.substring(1).replace('.', ''))
        const intDiscount = parseInt(result.onSale.slice(1, -1))
        blocks.push(section(
          text(`<${result.url}|${result.name}>\n${result.onSale ? `~${result.price}~` : result.price} ${result.onSale ? `${calculatePriceWithDiscount(intPrice, intDiscount)} (*${result.onSale}*)` : ''}`, TEXT_FORMAT_MRKDWN),
          {
            accessory: image(result.imageUrl, result.name)
          }
        ))
        blocks.push(
          section(
            text('   ', TEXT_FORMAT_PLAIN),
            {
              accessory: button(actionId, 'Añadir al carro', { url: `${storeHost}${result.addToCart}` })
            }
          )
        )
        blocks.push(divider())
      })
      return web.chat.postMessage({
        channel,
        blocks: blocks,
        text: '*Neeks.cl*'
      })
    }
    const search = msg.match[1]
    const url = storeHost + '?s=' + search.replace(' ', '+') + '&post_type=product'
    msg.send(':joystick: cargando Neeks.cl...')
    robot.http(url).get()(function (err, res, body) {
      const searchTerm = msg.match[1]
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
          const outOfStock = $2('.product-images > .out-of-stock').first().text()
          if (outOfStock) {
            buildAndSendBlockMessage(searchTerm, [])
            return
          }
          const name = $2('h1.product_title.entry-title').text()
          const url = res.headers.location
          const price = $2('.wds-price .woocommerce-Price-amount.amount bdi').first().text().trim()
          const imageUrl = $2('.product-images .wp-post-image').first().attr('data-src')
          const onSale = $2('.product-images > .onsale').first().text()
          const addToCartId = $2('.single_add_to_cart_button').first().attr('value')
          const addToCart = `?add-to-cart=${addToCartId}`
          results.push({
            name,
            url,
            price,
            imageUrl,
            onSale,
            addToCart
          })
          buildAndSendBlockMessage(searchTerm, results)
        })
      } else {
        const results = []
        $('.badge.out-of-stock ').parents('.product-type-simple').addClass('no')
        $('.product-type-simple:not(.no)').slice(0, productLimit).each(function () {
          const name = $(this).find('.woocommerce-loop-product__title a').text()
          const url = $(this).find('.woocommerce-loop-product__title a').attr('href')
          const price = $(this).find('.woocommerce-Price-amount.amount bdi').first().text().trim()
          const imageUrl = $(this).find('.attachment-woocommerce_thumbnail').attr('data-src')
          const addToCart = $(this).find('.add_to_cart_button').attr('href')
          const onSale = $(this).find('.onsale').text()
          results.push({
            name,
            url,
            price,
            imageUrl,
            addToCart,
            onSale
          })
        })
        buildAndSendBlockMessage(searchTerm, results)
      }
    })
  })
}
