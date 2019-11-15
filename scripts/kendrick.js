// Description:
//   Display pictures of pinceleart's girlfriend.
//
// Dependencies:
//   None
//
// Configuration:
//   None
//
// Commands:
//   hubot anna - Displays a Anna Kendrick picture
//
// Author:
//   @pinceleart

const images = [
  'https://i.giphy.com/WjVVrMaczJBaU.gif',
  'https://i.giphy.com/t3E11SO2NwFoY.gif',
  'https://i.giphy.com/pgfcixtsWrCi4.gif',
  'https://i.giphy.com/BDOtZlGcMsF32.gif',
  'https://i.giphy.com/nWaY3QKzEXkoo.gif',
  'https://i.giphy.com/vsPZNHlnBdz6U.gif',
  'https://i.giphy.com/QQ3iRObojdrt6.gif'
]

module.exports = robot => {
  robot.respond(/anna/gi, msg => msg.send(msg.random(images)))
}
