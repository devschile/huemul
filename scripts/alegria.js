// Description:
//   Te alegra el día
//
// Dependencies:
//   None
//
// Configuration:
//   None
//
// Commands:
//   hubot alegria - Te alegra el día
//   hubot alegría - Te alegra el día
//   hubot alégrame - Te alegra el día
//   hubot alegrame - Te alegra el día
//   hubot felicidad - Te alegra el día
//   hubot feliz - Te alegra el día
//   hubot yay - Te alegra el día
//
// Author:
//   @gmq

var images

images = [
  'http://i.imgur.com/1CVUXQE.jpg',
  'http://i.imgur.com/j9A8YUl.jpg',
  'http://i.imgur.com/G8nRHA1.jpg',
  'http://i.imgur.com/jBnk0tE.jpg',
  'http://i.imgur.com/r6J7KqM.jpg',
  'http://i.imgur.com/DtRWYYx.jpg',
  'http://i.imgur.com/h61dfpH.jpg',
  'http://i.imgur.com/vlUnHHU.jpg',
  'http://i.imgur.com/eOqlJzA.jpg',
  'http://i.imgur.com/GVx1dMf.jpg',
  'http://i.imgur.com/P8jfJpj.jpg',
  'http://i.imgur.com/soXHkwc.jpg',
  'http://i.imgur.com/Gv46SvH.jpg',
  'http://i.imgur.com/KnpXmLl.jpg',
  'http://i.imgur.com/zNr1BFu.jpg',
  'http://i.imgur.com/uKKjNf0.jpg',
  'http://i.imgur.com/PQqxDio.jpg',
  'http://i.imgur.com/r1fjFSG.jpg',
  'http://i.imgur.com/nxn9oO5.jpg',
  'http://i.imgur.com/7ocQVPw.jpg',
  'http://i.imgur.com/EQvk58v.jpg',
  'http://i.imgur.com/f5ODl4W.jpg',
  'http://i.imgur.com/9rSqOAV.jpg',
  'http://i.imgur.com/fPj6BBx.jpg',
  'http://i.imgur.com/FU3U0Vf.jpg',
  'http://i.imgur.com/nOpTzAJ.jpg',
  'http://i.imgur.com/MCU8fae.jpg',
  'http://i.imgur.com/fiI13Df.jpg',
  'http://i.imgur.com/K9jBg8N.jpg'
]

module.exports = function(robot) {
  robot.respond(/alegr[íi]a|al[ée]grame|felicidad|feliz|\byay\b/gi, function(msg) {
    msg.send(msg.random(images))
  })
}
