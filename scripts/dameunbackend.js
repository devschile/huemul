// Description:
//   Muestra un clásico backend al azar
//
// Dependencies:
//   None
//
// Configuration:
//   None
//
// Command:
//   huemul dame un backend
//
// Author:
//   @jorgeepunan

const images = [
  'https://i.imgur.com/3e93b3i.jpg',
  'https://i.imgur.com/Ov018QN.png',
  'https://i.imgur.com/uRM5nG7.jpg',
  'https://i.imgur.com/FNla8KM.jpg',
  'https://i.imgur.com/4V08TOr.jpg',
  'https://i.imgur.com/zhLoqXK.jpg',
  'https://i.imgur.com/Gvrhzwl.jpg',
  'https://i.imgur.com/fJ3qWPU.jpg',
  'https://i.imgur.com/3dQVdFo.jpg',
  'https://i.imgur.com/JceLGX6.jpg',
  'https://i.imgur.com/AaUDNy3.jpg',
  'https://i.imgur.com/6hO2jlS.jpg',
  'https://i.imgur.com/C0SOBeJ.jpg',
  'https://i.imgur.com/X3Msa6J.jpg',
  'https://i.imgur.com/yfcLG1M.png'
]

module.exports = robot => {
  robot.respond(/dame un backend/gi, msg => msg.send(msg.random(images)))
}
