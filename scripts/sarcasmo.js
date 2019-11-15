// Description:
//   Cambia el texto a sarcasmo
//
// Dependencies:
//   none
//
// Configuration:
//   none
//
// Commands:
//   hubot sarcasmo <texto> - Traduce le texto a sarcasmo
//
// Example:
//   hubot sarcasmo todos los admin de devschile son bakanes
//   tOdOs lOs aDmIn dE DeVsChIlE SoN BaKaNeS
//
// Author:
//   @madkoding

module.exports = function (robot) {
  const sarcastic = function (str) {
    return [...str]
      .map((char, i) => char[`to${i % 2 ? 'Upper' : 'Lower'}Case`]())
      .join('')
  }

  robot.respond(/sarcasmo (.*)/i, function (msg) {
    const text = msg.match[1]
    const sarcasted = sarcastic(text)
    msg.send(sarcasted)
  })
}
