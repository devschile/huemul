// Description:
//   Obtener el estado/recomendaciones de la semana respecto al polen en santiago
//
// Dependencies:
//   cheerio
//   node-fetch
//
// Configuration:
//   None
//
// Commands:
//   hubot polenes
//
// Author:
//   @joseglego

const cheerio = require('cheerio')
const fetch = require('node-fetch')

module.exports = function (robot) {
  robot.respond(/p(o|ó)lenes/i, function (msg) {
    const url = 'http://www.polenes.cl/?pagina=niveles'
    fetch(url)
      .then(res => res.text())
      .then(text => {
        const $ = cheerio.load(text)

        const totalTrees = text.match(/Total Arboles\\n\(\d*\.*\d* g\/m3\)/)
        const totalPlatanus = text.match(/Plátano Oriental\\n\(\d*\.*\d* g\/m3\)/)
        const totalGrass = text.match(/Pastos\\n\(\d*\.*\d* g\/m3\)/)
        const totalUndergrowth = text.match(/Malezas\\n\(\d*\.*\d* g\/m3\)/)

        const date = $('#div_contenido > div > section > div > div.g-pos-rel.g-z-index-1 > div.g-max-width-750.text-center.mx-auto.g-mb-10 > p.g-font-size-16.g-line-height-2').text()
        const comments = $('#div_contenido > div > section > div > div.row.pln-niveles.g-pt-30 > div:nth-child(1) > div > p').text()
        const forecast = $('#div_contenido > div > section > div > div.row.pln-niveles.g-pt-30 > div:nth-child(2) > div > p').text()
        const recommendations = $('#div_contenido > div > section > div > div.row.pln-niveles.g-pt-30 > div:nth-child(3) > div > p').text()

        const messages = []

        if (date) { messages.push(date) }

        if (totalTrees && totalTrees[0]) { messages.push(totalTrees[0].replace(/\\n/, ': ')) }
        if (totalPlatanus && totalPlatanus[0]) { messages.push(totalPlatanus[0].replace(/\\n/, ': ')) }
        if (totalGrass && totalGrass[0]) { messages.push(totalGrass[0].replace(/\\n/, ': ')) }
        if (totalUndergrowth && totalUndergrowth[0]) { messages.push(totalUndergrowth[0].replace(/\\n/, ': ')) }

        if (comments) { messages.push(`Comentarios: ${comments}`) }
        if (forecast) { messages.push(`Predicciones: ${forecast}`) }
        if (recommendations) { messages.push(`Recomendaciones: ${recommendations}`) }

        messages.push('Puedes ver más info en: http://www.polenes.cl/?pagina=niveles')

        msg.send(messages.join('\n'))
      }).catch(_ => msg.send('Ohh no, algo no está funcionando bien. ¿Conocen algún programador que pueda ver esto? :huemul-patitas:'))
  })
}
