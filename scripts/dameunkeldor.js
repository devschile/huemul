// Description:
//   Muestra un @keldor al azar
//
// Dependencies:
//   None
//
// Configuration:
//   None
//
// Command:
//   huemul dame un keldor
//
// Author:
//   @jorgeepunan

const images = [
  'https://i.imgur.com/b5a5rte.png',
  'https://i.imgur.com/EcOvyVv.png',
  'https://i.imgur.com/QiaaIzY.png',
  'https://i.imgur.com/H9QOiap.png',
  'https://i.imgur.com/SOq9AFc.png',
  'https://i.imgur.com/xTRc2y7.png',
  'https://i.imgur.com/OXqpGm6.png',
  'https://i.imgur.com/cD63Zt9.png',
  'https://i.imgur.com/6PzhUFF.png'
]

module.exports = robot => {
  robot.respond(/dame un keldor/gi, msg => msg.send(msg.random(images)))
}
