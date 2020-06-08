// Description:
//  Huemul muestra la cantidad de casos contagiados, recuperados y muertes por el corona virus
//
// Dependencies:
//   None
//
// Configuration:
//   None
//
// Commands:
//   hubot covid <pais> - Retorna la cantidad de casos de covid19 en <pais>, Chile por defecto.
//   hubot corona <pais> - Retorna la cantidad de casos de covid19 en <pais>, Chile por defecto.
//   hubot covid19 <pais> - Retorna la cantidad de casos de covid19 en <pais>, Chile por defecto.
//   hubot coronavirus <pais> - Retorna la cantidad de casos de covid19 en <pais>, Chile por defecto.
//
// Author:
//   @lgaticaq

const moment = require('moment')
const { flag } = require('country-emoji')

function formatNumber(number) {
  return number.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.')
}

module.exports = robot => {
  robot.respond(/(covid19|coronavirus|covid|corona) ?(.*)$/i, (res) => {
    const country = res.match[2] || 'Chile'

    const send = (confirmed, recovered, deaths, lastUpdate) => {
      confirmed = formatNumber(confirmed)
      recovered = formatNumber(recovered)
      deaths = formatNumber(deaths)
      const updated = moment(lastUpdate).format('MMMM DD h:mm A')
      const countryFlag = flag(country)
      const fallback = `Hay ${confirmed} casos confirmados, ${recovered} recuperados y ${deaths} muertes en ${country} ${countryFlag} \nÙltima actualización: ${updated}`

      if (['SlackBot', 'Room'].includes(robot.adapter.constructor.name)) {
        const options = {
          as_user: false,
          link_names: 1,
          icon_url: 'https://i.imgur.com/MzMz8ci.png',
          username: 'Covid 19',
          unfurl_links: false,
          attachments: [
            {
              fallback,
              color: 'danger',
              title: `Resumen de casos confirmados de Covid 19 en ${country} ${countryFlag}`,
              fields: [
                {
                  title: `:face_with_thermometer: Confirmados: ${confirmed}`
                },
                {
                  title: `:muscle: Recuperados: ${recovered}`
                },
                {
                  title: `:skull_and_crossbones: Muertos: ${deaths}`
                },
                {
                  title: `:clock1: Última actualización: ${updated}`
                }
              ]
            }
          ]
        }

        robot.adapter.client.web.chat.postMessage(res.message.room, null, options)
      } else {
        res.send(fallback)
      }
    }

    const url = `https://covid19.mathdro.id/api/countries/${country}`
    const errorMessage = 'Ocurrió un error al hacer la búsqueda'

    robot.http(url).get()((err, response, body) => {
      if (err) {
        robot.emit('error', err, res, 'covid19')
        robot.emit('slack.ephemeral', errorMessage, res.message.room, res.message.user.id)
      } else if (response.statusCode !== 200) {
        robot.emit('slack.ephemeral', errorMessage, res.message.room, res.message.user.id)
      } else {
        try {
          const data = JSON.parse(body)
          send(data.confirmed.value, data.recovered.value, data.deaths.value, data.lastUpdate)
        } catch (err) {
          robot.emit('error', err, res, 'covid19')
          robot.emit('slack.ephemeral', errorMessage, res.message.room, res.message.user.id)
        }
      }
    })
  })
}
