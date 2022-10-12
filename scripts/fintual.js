// Description:
//   Obtiene valores de los distintos fondos de la AGF Fintual
//
//
// Commands:
//   hubot fintual help - Imprime la ayuda
//   hubot fintual risky norris|moderate pitt|conservative clooney|conservative streep - Obtiene el valor del fondo seleccionado
//
// Author:
//   @cvallejos

const CLP = require('numbertoclpformater').numberToCLPFormater
const querystring = require('querystring')
const FINTUAL_REAL_ASSETS_API_URL = 'https://fintual.cl/api/real_assets/'
const NORMALIZE_AMOUNT = 100000
const NORRIS_A = 'risky norris'
const PITT_A = 'moderate pitt'
const CLOONEY_A = 'conservative clooney'
const STREEP_A = 'conservative streep'

const series = new Map([
  [NORRIS_A, 186],
  [PITT_A, 187],
  [CLOONEY_A, 188],
  [STREEP_A, 15077]
])

const seriesNames = Array.from(series.keys())

module.exports = robot => {
  robot.respond(/fintual (risky norris|moderate pitt|conservative clooney|conservative streep|help)$/i, res => {
    let uri
    const fund = res.match[1]
    if (fund === 'help') {
      const commands = seriesNames.map(function (i) {
        return `fintual ${i}`
      }).join('\n')
      res.send(`Mis comandos son:\n ${commands}`)
      return false
    }
    if (seriesNames.includes(fund)) {
      const today = new Date()
      const endDate = new Date()
      endDate.setDate(today.getDate())
      endDate.setYear(today.getFullYear() - 1)
      uri = FINTUAL_REAL_ASSETS_API_URL + series.get(fund) + '/days?' + querystring.stringify({ from_date: endDate.toISOString().slice(0, 10), to_date: today.toISOString().slice(0, 10) })
    }
    robot.http(uri)
      .get()((err, response, body) => {
        if (err) {
          robot.emit('error', err, res, 'fintual')
          res.send(`Ocurrió un error: ${err.message}`)
          return
        }
        response.setEncoding('utf-8')
        try {
          const data = JSON.parse(body)
          if (!data && seriesNames.includes(fund)) {
            return res.send('Sin resultados')
          } else {
            const days = data.data.length
            const firstElement = data.data[0]
            const monthElement = data.data[29]
            const semesterElement = data.data[Math.floor(days / 2)]
            const lastElement = data.data[data.data.length - 1]
            const returnLastMonth = parseFloat(monthElement.attributes.price / firstElement.attributes.price).toFixed(2)
            const returnLastSemester = parseFloat(semesterElement.attributes.price / firstElement.attributes.price).toFixed(2)
            const returnLastYear = parseFloat(lastElement.attributes.price / firstElement.attributes.price).toFixed(2)
            if (!isNaN(returnLastMonth) && !isNaN(returnLastSemester) && !isNaN(returnLastYear)) {
              const month = (returnLastMonth * NORMALIZE_AMOUNT)
              const emojiMonth = month > NORMALIZE_AMOUNT ? ':c3:' : ':gonzaleee:'
              const semester = (returnLastSemester * NORMALIZE_AMOUNT)
              const emojisemester = semester > NORMALIZE_AMOUNT ? ':chart_with_upwards_trend:' : ':chart_with_downwards_trend:'
              const year = (returnLastYear * NORMALIZE_AMOUNT)
              const emojiYear = year > NORMALIZE_AMOUNT ? ':patrones:' : ':money_with_wings:'
              res.send(`${fund.toUpperCase()}: Si hubieras invertido *${CLP(NORMALIZE_AMOUNT)}* \n- Hace un año, hoy tendrías: *${CLP(year)}* (${parseFloat((returnLastYear - 1) * 100).toFixed(2)}%) ${emojiYear} \n- Hace 6 meses, hoy esas 100 lucas serían *${CLP(semester)}* (${parseFloat((returnLastSemester - 1) * 100).toFixed(2)}%) ${emojisemester} \n- Hace un mes esas luquitas hoy serían *${CLP(month)}* (${parseFloat((returnLastMonth - 1) * 100).toFixed(2)}%) ${emojiMonth}`)
            } else {
              res.send('Error, intenta nuevamente *:c3:*.')
            }
          }
        } catch (error) {
          robot.emit('error', error, res, 'fintual-status')
          return res.send('Oops!, algo salió mal.')
        }
      })
  })
}
