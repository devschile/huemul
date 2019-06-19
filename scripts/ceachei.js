// Description:
//   ceacheieleechichichilelelevivachile
//
// Dependencies:
//   None
//
// Configuration:
//   None
//
// Commands:
//   hubot ceachei - Retorna la _arenga_ nacional
//
// Author:
//   @jorgeepunan

const ceachei = [
  'ce-hache-iiiii',
  `\`\`\`\n \
┌─┐┬ ┬┬┬┬┬┬┬┬┬\n \
│  ├─┤││││││││\n \
└─┘┴ ┴┴┴┴┴┴┴┴┴\n \
\`\`\``,
  'ele-eeeeeee',
  `\`\`\`\n \
┬  ┌─┐┌─┐┌─┐┌─┐┌─┐┌─┐\n \
│  ├┤ ├┤ ├┤ ├┤ ├┤ ├┤ \n \
┴─┘└─┘└─┘└─┘└─┘└─┘└─┘\n \
\`\`\``,
  `\`\`\`\n \
┌─┐┬ ┬┬   ┌─┐┬ ┬┬   ┌─┐┬ ┬┬\n \
│  ├─┤│───│  ├─┤│───│  ├─┤│\n \
└─┘┴ ┴┴   └─┘┴ ┴┴   └─┘┴ ┴┴\n \
\`\`\``,
  `\`\`\`\n \
┬  ┌─┐  ┬  ┌─┐  ┬  ┌─┐\n \
│  ├┤───│  ├┤───│  ├┤ \n \
┴─┘└─┘  ┴─┘└─┘  ┴─┘└─┘\n \
\`\`\``,
  `\`\`\`\n \
╦  ╦┬┬  ┬┌─┐\n \
╚╗╔╝│└┐┌┘├─┤\n \
 ╚╝ ┴ └┘ ┴ ┴\n \
\`\`\``,
  `\`\`\`\n \
╔═╗┬ ┬┬┬  ┌─┐┬\n \
║  ├─┤││  ├┤ │\n \
╚═╝┴ ┴┴┴─┘└─┘o\n \
\`\`\``
]

module.exports = function(robot) {
  return robot.respond(/ceachei|í/gi, function(msg) {
    let ceacheieleechichichilelelevivachile = function(i) {
      if (ceachei[i]) {
        msg.send(ceachei[i])
        setTimeout(function() {
          ceacheieleechichichilelelevivachile(i + 1)
        }, 1500)
      }
    }

    return ceacheieleechichichilelelevivachile(0)
  })
}
