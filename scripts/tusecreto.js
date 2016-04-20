// Description:
//   Tu secreto queda entre tú y :huemul:
//   Dile un secreto a @huemul por DM y éste lo anunciará en el canal #random sin mencionarte.
//
// Dependencies:
//   None
//
// Configuration:
//   None
//
// Commands:
//   hubot mi secreto <secreto>
//
// Author:
//   @jorgeepunan

module.exports = function(robot) {
	return robot.respond(/mi secreto (.*)/i, function(msg) {
		var secreto = msg.match[1];

		var words = ['@here', '@channel', '@group', '@everyone'];

		for (var i = 0; i < words.length; i++) {
			if (secreto.indexOf(words[i]) !== -1) {
				return robot.messageRoom('#random', "El tonto de " + msg.message.user.name + " trató de usar @");
			}
		}

		return robot.messageRoom('#random', ":speak_no_evil: *Un secreto:* " + secreto);
	});
};

