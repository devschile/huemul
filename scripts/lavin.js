// Description:
//   Muestra frases de https://twitter.com/ideasdelavin
//
// Dependencies:
//   -
//
// Configuration:
//   None
//
// Commands:
//   hubot idea|s lav[ií]n - Una frase random y actualizada de Joaquín Lavín
//
// Author:
//   @raulghm

module.exports = robot => {
  robot.respond(/idea(s)? lav[ií]n(.*)/i, msg => {
    getQuote()
      .then(result => {
        msg.send(`:lavin: ~ ${result}`)
      })
      .catch(err => {
        msg.send(`Error de Lavín, intenta más rato.`)
      })
  })

  function getQuote() {
    const url = 'https://api.graph.cool/simple/v1/cjitlaam22g9g0108oo6g43b8/graphql'
    const query = `{
      tweet {
        result
      }
    }`

    return new Promise((resolve, reject) => {
      const data = JSON.stringify({ query })

      robot
        .http(url)
        .header('Content-Type', 'application/json')
        .post(data)((err, res, body) => {
        if (err) return reject(err)
        try {
          const json = JSON.parse(body)
          if (json.data && json.data.tweet.result) {
            resolve(json.data.tweet.result)
          } else {
            resolve(null)
          }
        } catch (err) {
          reject(err)
        }
      })
    })
  }
}
