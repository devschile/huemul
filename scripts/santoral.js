// Description:
//   Hubot script que entrega el santoral del día
//
//  Dependencies:
//    cheerio
//    moment
//    S
//
// Commands:
//   hubot santoral - Muestra el santoral del día
//
// Author:
//   @jorgeepunan

const cheerio = require('cheerio')
const moment = require('moment')
const S = require('string')

module.exports = function (robot) {
  robot.respond(/santoral/i, msg => {
    const currentMonth = moment().format('MMMM')
    const currentDay = moment().format('D')
    const weekday = moment().format('dddd')

    let baseURL = `http://www.lasegunda.com/Especiales/santoral/${currentMonth}.html`

    robot.http(baseURL).get()(function (err, res, body) {
      if (err) console.error(err)
      const $ = cheerio.load(body)
      const daysList = $('.texto_signo p').html()
      let daysClean = daysList.split('<br>')
      let namesArray = []

      daysClean.forEach(function(item){
        item = S(item).unescapeHTML().s
        namesArray.push(S(item).collapseWhitespace().s)
      })

      const saintName = namesArray.find(a => a.includes(currentDay))

      msg.send(`Hoy ${weekday} ${currentDay} de ${currentMonth} el santoral es *${S(saintName).chompLeft(`${currentDay} `).s}* :angel:`)
    })
  })
}
