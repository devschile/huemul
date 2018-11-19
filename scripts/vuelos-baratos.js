// Description:
//   Show the cheapest flight to a city from Santiago using https://github.com/raerpo/huemul-airlines
//
// Dependencies:
//   None
//
// Configuration:
//   None
//
// Commands:
//   hubot vuelo barato a [ciudad] - Returns the cheapest price to [ciudad] from Santiago
//
// Author:
//   @raerpo_

module.exports = robot => {
  robot.respond(/vuelo barato a (.*)/i, msg => {
    // Normalize city name
    const city = msg.match[1]
      .toLowerCase()
      .replace('á', 'a')
      .replace('é', 'e')
      .replace('í', 'i')
      .replace('ó', 'o')
      .replace('ú', 'u')
      .replace('ñ', 'n')
      .replace('ã', 'a')
    msg.send(`Buscando el vuelo más barato para ${msg.match[1]} desde Santiago :airplane_departure: :loading:`)
    robot.http(`https://huemul-airlines.herokuapp.com/city/${city}`).get()((err, res, body) => {
      if (err || res.statusCode !== 200) {
        return robot.emit('error', err || new Error(`Status code ${res.statusCode}`), msg)
      }
      let json = JSON.parse(body)
      if (json.error) {
        msg.send(json.error)
        return
      }
      msg.send(`Encontré vuelos a ${msg.match[1]} desde CLP ${json.price}`)
      msg.send(`Se puede comprar aquí: ${json.url}`)
    })
  })
}
