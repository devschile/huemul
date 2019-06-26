// Description:
//   Devuelve una url corta generada por tupo.to
//
// Dependencies:
//
// Configuration:
//   None
//
// Commands:
//   hubot tupo.to <URL> - Devuelve una url corta generada por tupo.to
//   hubot tupoto <URL> - Devuelve una url corta generada por tupo.to
//   hubot tupotoizame <URL> - Devuelve una url corta generada por tupo.to
//   hubot tupotizame <URL> - Devuelve una url corta generada por tupo.to
//
// Author:
//   @victorsanmartin

module.exports = robot => {
  function checkUrl(url) {
    return /^(https?|ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i.test(
      url
    )
  }

  robot.respond(/tupo(\.to|to|toizame|tizame) (.*)/i, msg => {
    const url = msg.match[2]

    if (!checkUrl(url)) {
      msg.send(`tupo.to solo funciona con url y ${url} parece que no lo es.`)
      return
    }

    const data = JSON.stringify({ uri: url })

    robot
      .http('https://tupo.to/.netlify/functions/post')
      .header('Content-Type', 'application/json')
      .header('referer', 'https://tupo.to/')
      .post(data)((err, res, body) => {
      if (err) {
        robot.emit('error', err, msg, 'tupoto')
      } else {
        msg.send(`Toma tupo.to: ${body}`)
      }
    })
  })
}
