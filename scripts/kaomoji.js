// Description:
//  Devuelve un kaomoji con una búsqueda específica
//
// Dependencies:
//   None
//
// Configuration:
//   None
//
// Commands:
//   hubot kaomoji <keyword> - Devuelve un kaomoji para la búsqueda indicada
//
// Author:
//   @hectorpalmatellez

module.exports = robot => {
  robot.respond(/kaomoji (.*)/i, msg => {
    const url = 'https://jckcthbrt.stdlib.com/kaomoji/?search='
    const keyword = msg.match[1]
    const searchUrl = `${url}${keyword}`

    robot.http(searchUrl).get()((err, res, body) => {
      if (err) console.error(err)
      if (!body.includes('Error')) {
        const data = JSON.parse(body)
        msg.send(data.emoji)
      } else {
        msg.send('(ʃ⌣́,⌣́ƪ) ocurrió un error, intenta con otro término')
      }
    })
  })
}
