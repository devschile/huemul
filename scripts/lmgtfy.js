// Description:
// 	Para quienes les da flojera buscar en Google
// 	Huemul lo hace de la manera menos amable posible
//
// Dependencies:
// 	None
//
// Configuration:
// 	None
//
// Commands:
// 	hubot lmgtfy|google <consulta> - Mustra como buscar en Google
// 	hubot lmgtfy|google <@usuario> <consulta> - Mustra como buscar en Google
//
// Author:
// 	@ravenous

var rude = ['¿Era muy difícil? :wntard:', '¿En serio no sabías eso? :mufasatard:', 'Bienvenido a la Internet :lol2:']

module.exports = function(robot) {
  robot.respond(/(?:lmgtfy|google)\s(?:@(\w*))?\s?(.+)/i, function(res) {
    var lmgtfy, message
    lmgtfy = 'http://lmgtfy.com/?q='

    if (res.match[1]) {
      message = res.match[1] + ': ' + lmgtfy + ('' + escape(res.match[2]))
    } else {
      message = lmgtfy + ('' + escape(res.match[2]))
    }

    res.send(message + '\n' + res.random(rude))
  })
}
