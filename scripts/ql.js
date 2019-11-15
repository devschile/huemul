// Description:
//   Huemul se suicida si lo ofenden
//
// Dependencies:
//   None
//
// Configuration:
//   None
//
// Commands:
//   hubot ql|rql|ctm|m[áa]tate|culiao|reculiao|remilculiao - Muestra la muerte de :huemul:
//
// Author:
//   @jorgeepunan

const ascii = [
  '\n' +
'(҂._.)\n' +
'<,╤╦╤─ ҉ - - - - :huemul:\n' +
'/--\' \n\'',
  '\n' +
'━━━━━┓\n' +
'┓┓┓┓┓┃    ＼＼\n' +
'┓┓┓┓┓┃     :huemul: ~ chaoooooo\n' +
'┓┓┓┓┓┃\n' +
'┓┓┓┓┓┃ \n' +
'┓┓┓┓┓┃\n' +
'┓┓┓┓┓┃\n',
  ':bomb: :bomb: :bomb:\n' +
':bomb: :huemul: :bomb: :fire: ~ adiós mundo cruel\n' +
':bomb: :bomb: :bomb:\n'
]

module.exports = function (robot) {
  return robot.respond(/ql|rql|ctm|m[áa]tate|culiao|reculiao|remilculiao/gi, msg => msg.send(msg.random(ascii)))
}
