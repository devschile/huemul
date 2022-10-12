// Description:
//   Generate quote image from quozio
//
// Dependencies:
//   None
//
// Configuration:
//   None
//
// Commands:
//   hubot quozio <user> dijo <quote> - Generate quote image from quozio
//
// Author:
//   @lgaticaq

module.exports = robot => {
  const getRandomTheme = () => {
    const min = Math.ceil(1000)
    const max = Math.floor(2000)
    return Math.floor(Math.random() * (max - min)) + min
  }

  robot.respond(/quozio (.+) dijo (.+)/i, res => {
    const query = {
      a: res.match[1].trim(),
      q: res.match[2].trim()
    }
    if (query.q === '' || query.a === '') return
    robot.http('http://quozio.com/fetch/getQuoteRef.aspx').query(query).get()((err, response, body) => {
      let errMessage
      if (err) {
        robot.emit('error', err, res, 'quozio')
        errMessage = err.message
      }
      if (response.statusCode !== 200) {
        errMessage = `Wrong status code ${response.statusCode}`
      }
      if (errMessage) {
        return res.reply(`ocurrió el siguiente error: ${errMessage}`)
      }
      try {
        const data = JSON.parse(body)
        const theme = getRandomTheme()
        res.send(`https://d3kvsdrdan3wbb.cloudfront.net/img/${data.ref}/${theme}/${encodeURIComponent(query.q)}.jpg`)
      } catch (err) {
        robot.emit('error', err, res, 'quozio')
        return res.reply(`ocurrió el siguiente error: ${err.message}`)
      }
    })
  })
}
