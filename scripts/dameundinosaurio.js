// Description:
//   Muestra un dinosaurio al azar
//
// Dependencies:
//   None
//
// Configuration:
//   None
//
// Command:
//   hubot dame un saurio - Muestra un dinosaurio al azar
//
// Author:
//   @jriveros

const images = [
  'https://i.imgur.com/afMcjIv.jpg',
  'https://i.imgur.com/oQqwHny.jpg',
  'https://i.imgur.com/MWtrON3.jpg',
  'https://i.imgur.com/aFyBBfq.jpg',
  'https://i.imgur.com/sMl5hlF.jpg',
  'https://i.imgur.com/IQhRGYo.jpg',
  'https://i.imgur.com/9GKaYjd.jpg',
  'https://i.imgur.com/XCG5pCP.jpg',
  'https://i.imgur.com/A3waVPT.jpg',
  'https://i.imgur.com/uvVKy3B.jpg',
  'https://i.imgur.com/6QDEMJl.jpg',
  'https://i.imgur.com/s2p2h9I.jpg',
  'https://i.imgur.com/GzpQONR.jpg',
  'https://i.imgur.com/04AXj2m.jpg',
  'https://i.imgur.com/AI3N5Xm.jpg',
  'https://i.imgur.com/3sHB6Qb.jpg',
  'https://i.imgur.com/kz7ApVE.jpg'
]

module.exports = robot => {
  robot.respond(/dame un saurio/gi, msg => msg.send(msg.random(images)))
}
