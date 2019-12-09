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
const FINTUAL_REAL_ASSETS_API_URL = 'https://fintual.cl/api/real_assets/'
const NORMALIZE_AMOUNT = 100000
const NORRIS_A = 'risky norris'
const NORRIS_APV = 'norris-apv'
const PITT_A = 'moderate pitt'
const PITT_APV = 'pitt-apv'
const CLOONEY_A = 'conservative clooney'
const CLOONEY_APV = 'clooney-apv'
const STREEP_A = 'conservative streep'

const series = {
  [NORRIS_A]: 186,
  [NORRIS_APV]: 245,
  [PITT_A]: 187,
  [PITT_APV]: 246,
  [CLOONEY_A]: 188,
  [CLOONEY_APV]: 247,
  [STREEP_A]: 15077
}

const fundsName = [NORRIS_A, NORRIS_APV, PITT_A, PITT_APV, CLOONEY_A, CLOONEY_APV, STREEP_A]

module.exports = robot => {
  robot.respond(/fintual \b(risky norris|moderate pitt|conservative clooney|conservative streep)\b/i, res => {
    let uri
    const fund = res.match[0].replace('huemul fintual ', '').toLowerCase()
    if (fundsName.includes(fund)) {
      const today = new Date()
      const endDate = new Date()
      endDate.setDate(today.getDate())
      endDate.setYear(today.getFullYear() - 1)
      uri = FINTUAL_REAL_ASSETS_API_URL + series[fund] + '/days?from_date=' + endDate.toISOString().slice(0, 10) + '&to_date=' + today.toISOString().slice(0, 10)
    } else {
      res.send(
        'Mis comandos son:\n\n * `fintual ' + NORRIS_A + '|' + NORRIS_APV + '`\n * `fintual ' + PITT_A + '|' + PITT_APV + '`\n * `fintual ' + CLOONEY_A + '|' + CLOONEY_APV + '`\n * `fintual ' + STREEP_A + '`\n'
      )
      return false
    }
    robot.http(uri).get()((err, response, body) => {
      if (err) {
        robot.emit('error', err, res, 'fintual')
        res.send(`Ocurrió un error: ${err.message}`)
        return
      }
      response.setEncoding('utf-8')
      const data = JSON.parse(body)
      if (!data && fundsName.includes(fund)) {
        return res.send('Sin resultados')
      }
      const firstElement = data.data[0]
      const monthElement = data.data[29]
      const semesterElement = data.data[179]
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
        res.send(`${fund.toUpperCase()}: Si hubieras invertido *${CLP(NORMALIZE_AMOUNT)}* \n -Hace un año, hoy tendrías: *${CLP(year)}*(${parseFloat((returnLastYear - 1) * 100).toFixed(2)}%) ${emojiYear} \n- Hace 6 meses, hoy esas 100 lucas serían *${CLP(semester)}*(${parseFloat((returnLastSemester - 1) * 100).toFixed(2)}%) ${emojisemester} \n- Hace un mes esas luquitas hoy serían *${CLP(month)}*(${parseFloat((returnLastMonth - 1) * 100).toFixed(2)}%) ${emojiMonth}`)
      } else {
        res.send('Error, intenta nuevamente *:c3:*.')
      }
    })
  }
  )
}
