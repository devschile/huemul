// Description:
//   Trae info desde larger.io sobre una URL definida
//
// Dependencies:
//   larger.ip API Key
//
// Configuration:
//   None
//
// Commands:
//   hubot larger <site_url> - Trae info desde larger.io de la URL indicada
//
// Author:
//   @jorgeepunan

'use strict'

const url = 'https://api.larger.io/v1/'
const apiKey = process.env.LARGERIO_API_KEY

module.exports = robot => {
  robot.respond(/larger (.*)/i, res => {
    const siteUrl = res.match[1]

    robot.http(`${url}search/key/${apiKey}?domain=${siteUrl}`).get()((error, response, body) => {
      if (!error && response.statusCode === 200) {
        const data = JSON.parse(body)
        const info = data.apps
        const _regalos = []

        for (let i = 0; i < info.length; i++) {
          _regalos.push(` - ${data.apps[i].name}`)
        }

        const msg = `El sitio ${data.url} utiliza las siguentes tecnologías:\n${_regalos.join('\n')}`

        res.send(msg)
      } else {
        res.send(`:facepalm: Error: no existe ${siteUrl} (${error})`)
      }
    })
  })
}
