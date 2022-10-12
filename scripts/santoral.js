// Description:
//   Hubot script que entrega el santoral del día
//
//  Dependencies:
//    moment
//
// Commands:
//   hubot santoral - Muestra el santoral del día
//
// Author:
//   @jorgeepunan

const moment = require('moment')

const url = 'https://gist.githubusercontent.com/juanbrujo/c27f9bea0f5a7ac56802122ec50d5a9b/raw/1e7de22b3d71db061f6ea1e2f3495ecd453c94ff/santorales-catolicos.json'

module.exports = robot => {
  robot.respond(/santoral/i, msg => {
    const currentMonth = moment().format('MMMM')
    const currentDay = moment().format('D')
    const weekDay = moment().format('dddd')

    robot.http(url).get()((error, response, body) => {
      if (!error && response.statusCode === 200) {
        const santoral = JSON.parse(body)

        msg.send(`Hoy *${weekDay} ${currentDay} de ${currentMonth}* el santoral es *${santoral[currentMonth][currentDay - 1]}* :angel:`)
      } else {
        throw new Error(error)
      }
    })
  })
}
