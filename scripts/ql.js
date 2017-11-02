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
//   huemul ql|rql|ctm|m[áa]tate|culiao|reculiao|remilculiao|ch[úu]palo
//
// Author:
//   @jorgeepunan

const ascii = [`\n \
(҂._.)\n \
<,╤╦╤─ ҉ - - - - :huemul:\n \
/--\'\n\
`
,
`\n \
━━━━━┓\n \
┓┓┓┓┓┃    ＼＼\n \
┓┓┓┓┓┃     :huemul: ~ chaoooooo\n \
┓┓┓┓┓┃\n \
┓┓┓┓┓┃ \n \
┓┓┓┓┓┃\n \
┓┓┓┓┓┃\n\
`
,
`\
:bomb: :bomb: :bomb:\n \
:bomb: :huemul: :bomb: :fire: ~ adiós mundo cruel\n \
:bomb: :bomb: :bomb:\n\
`
];

module.exports = function(robot) {
  return robot.respond(/ql|rql|ctm|m[áa]tate|culiao|reculiao|remilculiao||ch[úu]palo/gi, msg => msg.send( msg.random(ascii) ));
};
