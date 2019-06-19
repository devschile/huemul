// Description:
//   Muestra un experto frontend al azar
//
// Dependencies:
//   None
//
// Configuration:
//   None
//
// Command:
//   hubot dame un frontend - Muestra un experto frontend al azar
//
// Author:
//   @jorgeepunan

const images = [
  'https://i.imgur.com/MjFHSnr.jpg',
  'https://i.imgur.com/oOX6nB5.jpg',
  'https://i.imgur.com/ZWNCa7M.jpg',
  'https://i.imgur.com/rZsNOzo.jpg',
  'https://i.imgur.com/VQD5sDj.jpg',
  'https://i.imgur.com/eJsWJjo.jpg',
  'https://i.imgur.com/6cxhd52.jpg',
  'https://i.imgur.com/vmJKlw4.jpg',
  'https://i.imgur.com/z65VKST.jpg',
  'https://i.imgur.com/K71ypBG.jpg',
  'https://i.imgur.com/XIhNm30.jpg',
  'https://i.imgur.com/F3HY1kf.jpg',
  'https://i.imgur.com/yAcFO4h.jpg',
  'https://i.imgur.com/nCzG3Xl.jpg'
]

module.exports = robot => {
  robot.respond(/dame un frontend/gi, msg => msg.send(msg.random(images)))
}
