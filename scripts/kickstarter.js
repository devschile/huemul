// Description:
//   Show random popular projects from kickstarter
//
// Dependencies:
//   None
//
// Configuration:
//   None
//
// Commands:
//   hubot kickstarter <term> - Show random popular projects from kickstarter. Example: `hubot kickstarter iot`
//
// Author:
//   @edades

module.exports = robot => {
  robot.respond(/kickstarter\s*(.*)?$/i, msg => {
    const send = options => {
      if (['SlackBot', 'Room'].includes(robot.adapter.constructor.name)) {
        robot.adapter.client.web.chat.postMessage(msg.message.room, null, options)
      } else {
        msg.send(options.attachments[0].fallback)
      }
    }
    const term = msg.match[1] ? msg.match[1].toLowerCase() : null
    const options = {
      as_user: false,
      link_names: 1,
      icon_url: 'http://oi68.tinypic.com/30w1280.jpg',
      username: 'Kickstarter Bot',
      unfurl_links: false,
      attachments: [{}]
    }
    if (!term) {
      const help = 'Debes escribir un término de búsqueda por ejemplo: tecnología, moda, cocina, etc.'
      options.attachments[0].fallback = help
      options.attachments[0].text = help
      options.attachments[0].color = '#004085'
      return send(options)
    }

    options.attachments[0].fallback = `Cargando los proyectos de *${term}* más populares en Kickstarter :loading:`
    options.attachments[0].title = `Cargando los proyectos de *${term}* más populares en Kickstarter :loading:`
    send(options)

    const popularTechProjects = `https://www.kickstarter.com/discover/popular?term=${term}&format=json&page=1&sort=magic`
    robot.http(popularTechProjects).get()((err, res, body) => {
      const defaultError = 'Ocurrió un error con la búsqueda'
      if (err || res.statusCode !== 200) {
        robot.emit('error', err || new Error(`Status code ${res.statusCode}`), msg, 'kickstarter')
        options.attachments[0].fallback = defaultError
        options.attachments[0].title = `Resultado de proyectos para ${term}`
        options.attachments[0].text = defaultError
        options.attachments[0].color = 'danger'
        return send(options)
      }

      try {
        const jsonData = JSON.parse(body)
        if (jsonData.projects.length === 0) {
          const help = `No se han encontrado resultados para *${term}*`
          options.attachments[0].fallback = help
          options.attachments[0].text = help
          options.attachments[0].color = '#004085'
          return send(options)
        }
        const projects = jsonData.projects.map((item, key) => ({
          name: item.name,
          description: item.blurb,
          creator: item.creator.name,
          location: item.location.displayable_name,
          url: item.urls.web.project,
          id: key
        }))
        projects.map(item => {
          if (item.id < 3) {
            const text = `
- Nombre: ${item.name}
- Descripción: ${item.description}
- Creado por: ${item.creator}
- Ubicación: ${item.location}
- Url: ${item.url}`
            options.attachments[0].fallback = text
            options.attachments[0].title = item.name
            options.attachments[0].color = 'good'
            options.attachments[0].title_link = item.url
            options.attachments[0].fields = [
              {
                value: `Descripción: ${item.description}`,
                short: false
              },
              {
                value: `Creado por: ${item.creator}`,
                short: false
              },
              {
                value: `Ubicación: ${item.location}`,
                short: false
              }
            ]
            send(options)
          }
        })
        if (projects.length > 3) {
          const moreUrl = `https://www.kickstarter.com/discover/popular?term=${term}&page=1&sort=magic`
          options.attachments[0].title = `Ver más proyectos de ${term}`
          options.attachments[0].title_link = moreUrl
          options.attachments[0].fallback = `Ver más en: ${moreUrl}`
          send(options)
        }
      } catch (err) {
        robot.emit('error', err, res, 'kickstarter')
        options.attachments[0].fallback = defaultError
        options.attachments[0].title = `Resultado de proyectos para ${term}`
        options.attachments[0].text = defaultError
        options.attachments[0].color = 'danger'
        send(options)
      }
    })
  })
}
