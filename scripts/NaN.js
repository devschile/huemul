// Description:
//   NaNNaNNaNNaNNaNNaNNaNNaNNaNNaNNaNNaNNaNNaNNaN Batman!
//
// Dependencies:
//   None
//
// Configuration:
//   None
//
// Commands:
//   NaN - Retorna NaNNaNNaNNaNNaNNaNNaNNaNNaNNaNNaNNaNNaNNaNNaN Batman!
//
// Author:
//   @jorgeepunan

function batman() {
  return Array(16).join('wat' - 1) + ' Batman! ~ :huemul:'
}

module.exports = function(robot) {
  robot.hear(/NaN/, function(res) {
    msg = batman()
    res.send(msg)
  })
}
