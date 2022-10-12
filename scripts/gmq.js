// Description:
//   Obtener un nombre random para el querido gmq
//
// Dependencies:
//   csv-streamify
//
// Configuration:
//   None
//
// Commands:
//   hubot random gmq - Obtiene el nombre completo de gmq
//
// Author:
//   @lgaticaq

const https = require('https')
const csv = require('csv-streamify')
const urlFNames =
  'https://cdn.jsdelivr.net/gh/marcboquet/spanish-names@fb9664001e060e430a8e9314fc1992541f378297/hombres.csv'
const UrlLNames =
  'https://cdn.jsdelivr.net/gh/marcboquet/spanish-names@fb9664001e060e430a8e9314fc1992541f378297/apellidos.csv'

module.exports = robot => {
  robot.respond(/random gmq/i, res => {
    const parserFNames = csv({ objectMode: true })
    const parserLNames = csv({ objectMode: true })
    const fNames = []
    const lNames1 = []
    const lNames2 = []

    parserFNames.on('data', line => {
      if (/^G/.test(line[0])) fNames.push(titleize(line[0].split(' ').shift()))
    })

    parserLNames.on('data', line => {
      if (/^M/.test(line[0])) lNames1.push(titleize(line[0].split(' ').shift()))
      if (/^Q/.test(line[0])) lNames2.push(titleize(line[0].split(' ').shift()))
    })

    const getCsv = (uri, stream) => {
      return new Promise((resolve, reject) => {
        https.get(uri, res => {
          res.once('error', reject)
          res.on('data', data => stream.write(data)).on('end', () => {
            stream.end()
            resolve()
          })
        })
      })
    }

    const titleize = name => {
      name = name.toLowerCase()
      return `${name[0].toUpperCase()}${name.substr(1)}`
    }

    const random = collection => collection[Math.floor(Math.random() * collection.length)]

    const promises = [getCsv(urlFNames, parserFNames), getCsv(UrlLNames, parserLNames)]
    Promise.all(promises)
      .then(() => {
        res.send(`${random(fNames)} ${random(lNames1)} ${random(lNames2)}`)
      })
      .catch(err => robot.emit('error', err, res, 'gmq'))
  })
}
