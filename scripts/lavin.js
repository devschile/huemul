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
     * @param {string} image
     * @param {boolean} [error=false]
     */
    const send = (quote, image, error = false) => {
      if (['SlackBot', 'Room'].includes(robot.adapter.constructor.name)) {
        const attachment = {
          fallback: quote,
          text: quote,
          color: error ? 'danger' : 'info'
        }
        if (image) attachment.image_url = image
        const options = {
          as_user: false,
          link_names: 1,
          icon_url: 'https://i.imgur.com/PcIlgxP.jpg',
          username: 'Joaquín Lavín',
          unfurl_links: false,
          attachments: [attachment]
        }
        robot.adapter.client.web.chat.postMessage(msg.message.room, null, options)
      } else {
        msg.send(error ? quote : `> ${quote}`)
      }
    }

    try {
      const quote = await getQuote()
      send(quote.result, quote.image)
    } catch (err) {
      send('Error de Lavín, intenta más rato.', true)
    }
  })

  /**
   * @returns {Promise<object>}
   */
  function getQuote() {
    const url = 'https://api.graph.cool/simple/v1/cjitlaam22g9g0108oo6g43b8/graphql'
    const query = `{
      tweet {
        result
        image
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
            resolve(json.data.tweet)
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
