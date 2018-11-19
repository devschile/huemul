// Description:
//   Muestra los últimos temblores significativos en cualquier país del 🌍.
//
// Dependencies:
//   None
//
// Configuration:
//   None
//
// Commands:
//   hubot temblores <Chile|Nombre País> (sin país despliega en todo el mundo)
//
// Author:
//   @jorgeepunan

module.exports = robot => {
  robot.respond(/temblores( .*)?/i, res => {
    const country = res.match[1] ? res.match[1].trim().toUpperCase() : null
    const minMagnitude = 6 // Con un temblor menor a 6 grados ni me muevo de la silla menos de la cama asi q este es el mínimo.
    const fetch = robot
      .http('https://earthquake.usgs.gov')
      .path('/fdsnws/event/1/query')
      .query({ format: 'geojson', minmagnitude: minMagnitude }) // {starttime: 'YYYY-MM-DDTHH:mm:ss-04:00'}

    fetch.get()((error, response, body) => {
      if (error) return robot.emit('error', error, res)
      if (response.statusCode !== 200)
        return robot.emit('error', new Error(`Response statusCode is ${response.statusCode}`), res)
      const { features: earthquakes } = JSON.parse(body)

      const earthquakesFilter = earthquakes.filter(({ properties: { place } }) => {
        return country ? new RegExp(country, 'i').test(place) : true
      })

      if (robot.adapter.constructor.name === 'SlackBot') {
        const options = {
          as_user: false,
          link_names: 1,
          icon_url: 'https://www.usgs.gov/sites/all/themes/usgs_palladium/favicons/apple-touch-icon.png',
          username: 'USGS',
          unfurl_links: false
        }
        if (earthquakesFilter.length === 0) {
          const text = `Por suerte, ningún temblor mayor a ${minMagnitude} grados en ${country || 'todo el mundo'}.`
          options.attachments = [
            {
              fallback: text,
              text: text
            }
          ]
          return robot.adapter.client.web.chat.postMessage(res.message.room, null, options)
        }
        options.attachments = earthquakesFilter.slice(0, 5).map(({ properties: { place, mag, time, title, url } }) => {
          const fallback = `${title}: \n- Lugar: ${place} \n- Magnitud: ${mag} (richter) \n- Fecha/Hora: ${new Date(
            time
          ).toString()} \n- Enlace: ${url}`
          return {
            fallback: fallback,
            color: '#36a64f',
            title: title,
            title_link: url,
            fields: [
              {
                title: 'Lugar',
                value: place,
                short: true
              },
              {
                title: 'Magnitud',
                value: `${mag} (richter)`,
                short: true
              },
              {
                title: 'Fecha',
                value: new Date(time)
                  .toISOString()
                  .replace(/(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2}:\d{2}).\d+Z/, '$1 $2 UTC'),
                short: true
              }
            ]
          }
        })
        robot.adapter.client.web.chat.postMessage(res.message.room, null, options)
      } else {
        if (earthquakesFilter.length === 0) {
          return res.send(`Por suerte, ningún temblor mayor a ${minMagnitude} grados en ${country || 'todo el mundo'}.`)
        }
        res.send(
          earthquakesFilter
            .slice(0, 5).map(({ properties: { place, mag, time, title, url } }) => {
              return `${title}: \n- Lugar: ${place} \n- Magnitud: ${mag} (richter) \n- Fecha/Hora: ${new Date(
                time
              ).toString()} \n- Enlace: ${url}`
            })
            .join('\n\n')
        )
      }
    })
  })
}
