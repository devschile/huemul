// Description:
//   Imprime una url a un gif de table flipping
//
// Dependencies:
//   None
//
// Configuration:
//   None
//
// Commands:
//   hubot flip - Imprime una url a un gif de table flipping
//
// Author:
//   @hectorpalmatellez

module.exports = function(robot) {
  robot.respond(/flip/i, function(msg) {
    var url = 'http://www.tableflipper.com/json'
    robot.http(url).get()(function(err, res, body) {
      var data = JSON.parse(body)
      msg.send(data.gif.replace('http://', 'http://www.'))
    })
  })
}
