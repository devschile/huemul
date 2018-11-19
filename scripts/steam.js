// Description:
//   Get the current steam daily deal.
//   Get info about games

// Dependencies:
//   "cheerio": "latest"

// Commands:
//   hubot steam daily - Muestra la oferta del día.
//   hubot steam [Nombre Juego] - Muestra información básica de un juego.
//   hubot steam help - Muestra los comandos disponibles.

// Author:
//   @christopher

'use strict'
const cheerio = require('cheerio')
const { numberToCLPFormater } = require('numbertoclpformater')

const commands = [
  `Comandos de Steam:`,
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
          return reject(err || new Error(`Status code ${res.statusCode}`))
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
        .map(function() {
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
      return idAttr.substr(idAttr.length - 6)
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

  const getPrice = id => {
    return getGameDetails(id).then(body => {
      try {
        const game = JSON.parse(body)[id].data
        const name = game.name
        const price = game.price_overview
        const final = price.final / 100
        const initial = price.initial / 100
        const discount = price.discount_percent
        return {
          name: name,
          final: final,
          initial: initial,
          discount: discount,
          uri: `https://store.steampowered.com/app/${id}`
        }
      } catch (err) {
        throw err
      }
    })
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
        //sugar
        const meta = !game.metacritic ? 0 : game.metacritic.score
        //price process
        const itsfree = game.is_free
        const price = itsfree ? 0 : game.price_overview
        const final = !game.release_date.coming_soon ? price.final / 100 : 0
        //Important!
        const dev = game.developers
        const editor = game.publishers
        const release = game.release_date.coming_soon ? 'Coming Soon' : game.release_date.date
        const discount = !game.release_date.coming_soon ? price.discount_percent : 0
        const uri = `https://store.steampowered.com/app/${id}`
        return {
          name,
          genres,
          price,
          final,
          discount,
          uri,
          desc,
          dev,
          editor,
          release,
          meta,
          type
        }
      } catch (err) {
        throw err
      }
    })
  }

  const sendMessage = (message, channel) => {
    if (robot.adapter.constructor.name === 'SlackBot') {
      const options = { unfurl_links: false, as_user: true }
      robot.adapter.client.web.chat.postMessage(channel, message, options)
    } else {
      robot.messageRoom(channel, message)
    }
  }

  const onError = (err, msg, text) => {
    if (err === 404) {
      msg.send(text)
    } else {
      msg.send('Actualmente _Steam_ no responde.')
      robot.emit('error', err || new Error(`Status code ${res.statusCode}`), msg)
    }
  }

  robot.respond(/steam(.*)/i, msg => {
    const args = msg.match[1].split(' ')[1]
    const full = msg.match[1]

    if (args === 'help') {
      return sendMessage(commands.join('\n'), msg.message.room)
    }
    if (args === 'daily') {
      return getDailyId()
        .then(getPrice)
        .then(data => {
          sendMessage(
            `¡Lorea la oferta del día!: *${data.name}*, a sólo *${numberToCLPFormater(
              data.final,
              'CLP $'
            )}*. Valor original *${numberToCLPFormater(data.initial, 'CLP $')}*, eso es un -*${data.discount}*%! <${
              data.uri
            }|Ver más>`,
            msg.message.room
          )
        })
        .catch(err => onError(err, msg, 'No se encontró la oferta del día, revisaste los especiales?'))
    }
    getGameDesc(full)
      .then(getDesc)
      .then(data => {
        if (data.type !== 'game') {
          return msg.send(`¡Cuek!, no encontré el juego`)
        }
        let meta = data.meta === 0 ? 'No Registra' : data.meta
        let genres = data.genres
        const fields = [
          `Nombre del Juego: *${data.name}*`,
          `Desarrollador: *${data.dev}*`,
          `Editor: *${data.editor}*`,
          `Metacritic: *${meta}*`,
          `Fecha del Lanzamiento: *${data.release}*`,
          `Género: *${genres}*`,
          `Descripción: ${data.desc} <${data.uri}|Ver más>`
        ]
        let price
        let discount = ''
        if (data.discount > 0) {
          price = data.final
          discount = ` (%${data.discount} Off)`
        } else {
          price = data.price === 0 ? 'Free-To-Play' : data.final
        }
        if (!isNaN(parseFloat(price)) && isFinite(price)) {
          fields.splice(1, 0, `Valor: *${numberToCLPFormater(price, 'CLP $')}*${discount}`)
        } else {
          fields.splice(1, 0, `Valor: *${price}*`)
        }
        msg.send(fields.join('\n'))
      })
      .catch(err => onError(err, msg, '¡Cuek!, no encontré el juego'))
  })
}
