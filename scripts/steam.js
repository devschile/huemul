// Description:
//   Get the current steam daily deal.
//   Get info about games

// Dependencies:
//   "cheerio": "latest"

// Commands:
//   hubot steam daily - Muestra la oferta del día.
//   hubot steam <Nombre Juego> - Muestra información básica de un juego.
//   hubot steam help - Muestra los comandos disponibles.

// Author:
//   @christopher
//   @dilip

'use strict'
const cheerio = require('cheerio')
const { block, object, TEXT_FORMAT_MRKDWN } = require('slack-block-kit')
const { text } = object
const { section, divider, image, context } = block
const { numberToCLPFormater } = require('numbertoclpformater')
const { WebClient } = require('@slack/web-api')
const token = process.env.HUBOT_SLACK_TOKEN
const web = new WebClient(token)
const commands = [
  'Comandos de Steam:',
  '`huemul steam daily` - Muestra la oferta del día.',
  '`huemul steam [Nombre Juego]` - Muestra información básica de un juego.'
]
module.exports = robot => {
  const getBody = (uri, options = {}) => {
    return new Promise((resolve, reject) => {
      const request = robot.http(uri)
      if (options.headers) request.headers(options.headers)
      if (options.query) request.query(options.query)
      request.get()((err, res, body) => {
        if (err || res.statusCode !== 200) {
          return reject(err || res.statusCode)
        }
        resolve(body)
      })
    })
  }

  const getGameDesc = game => {
    const options = { query: { term: game } }
    return getBody('https://store.steampowered.com/search/', options).then(body => {
      const $ = cheerio.load(body)
      const games = $('.search_result_row')
        .slice(0, 1)
        .map(function () {
          return $(this).attr('data-ds-appid')
        })
        .get()
      return games
    })
  }

  const getDailyId = () => {
    return getBody('https://store.steampowered.com').then(body => {
      const $ = cheerio.load(body)
      const idAttr = $('.dailydeal_desc .dailydeal_countdown').attr('id')
      return idAttr && idAttr.replace(/[^0-9.]/g, '')
    })
  }

  const getGameDetails = id => {
    const options = {
      query: { appids: id, cc: 'CL' },
      headers: {
        cookie: 'steamCountry=CL%7Cb8a8a3da46a6c324d177af2855ca3d9b;timezoneOffset=-10800,0;'
      }
    }
    const uri = 'https://store.steampowered.com/api/appdetails/'
    return getBody(uri, options)
  }

  const getDesc = id => {
    return getGameDetails(id).then(body => {
      try {
        const game = JSON.parse(body)[id].data
        if (game.type !== 'game') return game.type
        const type = game.type
        const desc = game.short_description
        const name = game.name
        const genres = game.genres.map(el => el.description).join(', ')
        // sugar
        const meta = !game.metacritic ? 0 : game.metacritic.score
        // price process
        const itsfree = game.is_free
        const price = itsfree ? 0 : game.price_overview
        const initial = price && price.initial > 0 ? price.initial / 100 : price && price.initial
        const final = !game.release_date.coming_soon ? price && price.final / 100 : 0
        // Important!
        const dev = game.developers
        const editor = game.publishers
        const release = game.release_date.coming_soon ? 'Coming Soon' : game.release_date.date
        const discount = !game.release_date.coming_soon ? price && price.discount_percent : 0
        const uri = `https://store.steampowered.com/app/${id}`
        return {
          name,
          genres,
          price,
          initial,
          final,
          discount,
          uri,
          desc,
          dev,
          editor,
          release,
          meta,
          type,
          id
        }
      } catch (err) {
        throw err
      }
    })
  }

  const formatPrice = (initial, final, discount) => {
    let priceFormated = ''
    if (!initial || initial === 0) {
      priceFormated = 'Free-To-Play'
    } else {
      if (discount) {
        priceFormated = `~${numberToCLPFormater(initial)}~ ${numberToCLPFormater(final)} ${parseInt(discount) ? `(${discount}% OFF)` : discount}`
      } else {
        priceFormated = `${numberToCLPFormater(final)}`
      }
    }
    return priceFormated
  }

  const buildGameMessage = data => {
    const {
      meta,
      genres,
      name,
      dev,
      editor,
      release,
      desc,
      uri,
      discount,
      initial,
      final,
      id,
      isDaily
    } = data
    let priceFormated = formatPrice(initial, final, discount)
    if (release === 'Coming Soon') {
      priceFormated = priceFormated + ' (Unreleased)'
    }
    const blocks = []
    const heroImage = `https://cdn.cloudflare.steamstatic.com/steam/apps/${id[0]}/hero_capsule.jpg`
    const headerText = isDaily ? 'Oferta del día en Steam' : 'Descripción de juego en Steam'
    const huemulPrefix = '/huemul'
    blocks.push(JSON.parse(`{
      "type": "header",
      "text": {
        "type": "plain_text",
        "text": "${headerText}"
      }
    }`))
    blocks.push(divider())
    blocks.push(section(text(`<${uri}|${name}>`, TEXT_FORMAT_MRKDWN)))
    blocks.push(section(
      text(`*${priceFormated}*\n${desc}`, TEXT_FORMAT_MRKDWN),
      {
        accessory: image(heroImage, name)
      }
    ))
    blocks.push(context([
      image(huemulPrefix + '/images/huemul-steam-game-dev-bg.png', name),
      text(`*Desarrollador*: ${dev}`, TEXT_FORMAT_MRKDWN)
    ]))
    blocks.push(context([
      image(huemulPrefix + '/images/huemul-steam-editor-bg.png', name),
      text(`*Editor*: ${editor}`, TEXT_FORMAT_MRKDWN)
    ]))
    blocks.push(context([
      image(huemulPrefix + '/images/huemul-steam-metacritic.png', name),
      text(`*Metacritic*: ${meta === 0 ? 'No Registra' : meta}`, TEXT_FORMAT_MRKDWN)
    ]))
    blocks.push(context([
      image(huemulPrefix + '/images/huemul-steam-launch-bg.png', name),
      text(`*Fecha de lanzamiento*: ${release}`, TEXT_FORMAT_MRKDWN)
    ]))
    blocks.push(context([
      image(huemulPrefix + '/images/huemul-steam-genre-bg.png', name),
      text(`*Género*: ${genres}`, TEXT_FORMAT_MRKDWN)
    ]))
    return blocks
  }
  const sendMessage = (message, channel) => {
    let data
    if (!Array.isArray(message)) {
      data = {
        channel,
        text: message
      }
    } else {
      data = {
        channel,
        blocks: message,
        text: '*Steam*'
      }
    }
    return web.chat.postMessage(data)
  }

  const onError = (err, msg, text) => {
    if (err === 404 || err === 400) {
      msg.send(text)
    } else {
      msg.send('Actualmente _Steam_ no responde.')
      robot.emit('error', err, msg, 'steam')
    }
  }

  robot.respond(/steam(.*)/i, msg => {
    const args = msg.match[1].split(' ')[1]
    const full = msg.match[1]

    if (args === 'help') {
      return sendMessage(commands.join('\n'), msg.message.room)
    }
    web.chat.postMessage({
      channel: msg.message.room,
      text: 'Cargando búsqueda en Steam :steam: :loading:'
    })
    if (args === 'daily') {
      return getDailyId()
        .then(getDesc)
        .then(data => {
          sendMessage(
            buildGameMessage({
              isDaily: true,
              ...data
            }),
            msg.message.room
          )
        })
        .catch(err => onError(err, msg, 'No se encontró la oferta del día, revisaste los especiales?'))
    }
    getGameDesc(full)
      .then(getDesc)
      .then(data => {
        if (data.type !== 'game') {
          return msg.send('Juego no encontrado.')
        }
        let discount = ''
        if (data.discount > 0) {
          discount = ` (%${data.discount} Off)`
        }
        data.discount = discount
        sendMessage(buildGameMessage(data), msg.message.room)
      })
      .catch(err => onError(err, msg, 'Juego no encontrado'))
  })
}
