// Description:
//   Muestra un Piolin Bendiciones al azar
//
// Dependencies:
//   None
//
// Configuration:
//   None
//
// Command:
//   hubot dame un piolin - Muestra un piolin bendiciones al azar
//   hubot dame un piolín - Muestra un piolin bendiciones al azar
//
// Author:
//   @nicoavila

const images = [
  'https://i.imgur.com/RKJwhsn.jpg',
  'https://i.imgur.com/tuCGvWq.jpg',
  'https://i.imgur.com/Nok5dvX.jpg',
  'https://i.imgur.com/aeJoZ0k.jpg',
  'https://i.imgur.com/DqXzmfI.jpg'
]

module.exports = robot => {
  robot.respond(/dame un piol[ií]n/gi, msg => msg.send(msg.random(images)))
}
