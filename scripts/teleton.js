// Description:
//   Obtiene el cómputo actual de la Teletón desde el endpoint de OCI
//
// Dependencies:
//   moment
//
// Commands:
//   hubot teleton - Obtiene el cómputo actual de la Teletón
//
// Author:
//   @jorgeepunan

const fetch = require('node-fetch')
const moment = require('moment')

module.exports = robot => {
  robot.respond(/teleton/i, async msg => {
    try {
      const url = 'https://axtoczxlicpz.objectstorage.sa-santiago-1.oci.customer-oci.com/n/axtoczxlicpz/b/teleton-bucket/o/computo.json'
      
      const response = await fetch(url)
      
      if (!response.ok) {
        robot.emit('error', new Error(`HTTP ${response.status}`), msg, 'teleton')
        return msg.reply('ocurrió un error al obtener el cómputo de la Teletón 2025')
      }

      const data = await response.json()
      
      // Obtener la cifra del endpoint
      const cifra = data.cifra
      
      if (cifra === undefined || cifra === null) {
        robot.emit('error', new Error(`Invalid data format: ${JSON.stringify(data)}`), msg, 'teleton')
        return msg.reply('los datos no tienen el formato esperado')
      }

      // Usar la hora actual
      const time = moment()

      // Formatear según la especificación: Cómputo a las [HH:MM] [DD/MM/YYYY]: [CIFRA]
      const formatted = `Cómputo a las ${time.format('HH:mm')} ${time.format('DD/MM/YYYY')}: $ ${cifra}`
      
      msg.send(formatted)
    } catch (err) {
      robot.emit('error', err, msg, 'teleton')
      msg.reply('ocurrió un error al obtener el cómputo de la Teletón 2025')
    }
  })
}
