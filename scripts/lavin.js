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
//   hubot idea|ideas lavin - Una frase random y actualizada de Joaquín Lavín
//
// Author:
//   @raulghm

module.exports = robot => {
  robot.respond(/idea(s)? lav[ií]n(.*)/i, async msg => {
    /**
     * @param {string} quote
     * @param {boolean} [error=false]
     */
    const send = (quote, error = false) => {
      if (['SlackBot', 'Room'].includes(robot.adapter.constructor.name)) {
        const options = {
          as_user: false,
          link_names: 1,
          icon_url: 'https://i.imgur.com/PcIlgxP.jpg',
          username: 'Joaquín Lavín',
          unfurl_links: false,
          attachments: [
            {
              fallback: quote,
              text: quote,
              color: error ? 'danger' : 'info'
            }
          ]
        }
        robot.adapter.client.web.chat.postMessage(msg.message.room, null, options)
      } else {
        msg.send(error ? quote : `> ${quote}`)
      }
    }

    try {
      const result = await getQuote()
      send(result)
    } catch (err) {
      send('Error de Lavín, intenta más rato.', true)
    }
  })

  /**
   * @returns {Promise<string>}
   */
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
