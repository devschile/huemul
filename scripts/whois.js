// Description:
//   Saves and shows user descriptions
//
// Dependencies:
//   None
//
// Configuration:
//   None
//
// Commands:
//   hubot soy <text> - Saves <text> as the user's description
//   hubot quién es@<username> - Displays user's description
//
// Author:
//   @gmq

module.exports = function (robot) {
  robot.respond(/qui[ée]n es @(\w+)/i, function (res) {
    var name = res.match[1].trim()
    var users = robot.brain.usersForFuzzyName(name)
    var msg
    if (users.length > 1) {
      msg = 'Pucha, ¿puedes ser más especifico?'
    } else if (users.length === 0 || (users.length === 1 && typeof users[0].descripcion === 'undefined')) {
      msg = 'No tengo idea quién es.'
    } else {
      msg = '@' + users[0].name + ' es ' + users[0].descripcion
    }
    res.send(msg)
  })
  robot.respond(/soy (.+)$/i, function (res) {
    var user = robot.brain.userForId(res.message.user.id)
    user.descripcion = res.match[1]
    robot.brain.save()
  })
}
