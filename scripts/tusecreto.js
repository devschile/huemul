// Description:
//   Tu secreto queda entre tú y :huemul:
//   Dile un secreto a @huemul por DM y éste lo anunciará en el canal seleccionado o #random sin mencionarte.
//
// Dependencies:
//   None
//
// Configuration:
//   HUBOT_MYSECRET_ALLOWED_CHANNELS: Lista de canales separados por comas.
//                                    Ej: '#random,#pegas,#otrocanal'
//
// Commands:
//   hubot mi secreto <secreto> - Envia el secreto al canal #random.
//   hubot mi secreto <canal> <secreto> - Envia el secreto al canal seleccionado.
//
// Author:
//   @jorgeepunan

module.exports = function(robot) {
  return robot.respond(/mi secreto (.*)/i, function(msg) {
    var secreto = msg.match[1];
    var channel = '#random';
    var allowedChannels = process.env.HUBOT_MYSECRET_ALLOWED_CHANNELS || '#random';
    var secretoArr = secreto.split(' ');

    allowedChannels = allowedChannels.split(',');

    if ((allowedChannels.indexOf('#' + secretoArr[0]) !== -1) || (robot.golden.isGold(msg.message.user.name))) {
      channel = '#' + secretoArr.shift();
      secreto = secretoArr.join(' ');
    }

    if (secreto.length === 0) {
      return robot.messageRoom(msg.message.user.id, "¿Y el secreto?");
    }

    var slackChannel = robot.adapter.client.rtm.dataStore.getChannelByName(channel);

    if (!slackChannel) {
      return robot.messageRoom(msg.message.user.id, "No sé qué canal es ese.");
    };

    if (!slackChannel.is_member) {
      return robot.messageRoom(msg.message.user.id, "No estoy en " + channel + ". :sadhuemul:");
    };

    var forbiddenWords = ['@here', '@channel', '@group', '@everyone'];

    for (var i = 0; i < forbiddenWords.length; i++) {
      if (secreto.indexOf(forbiddenWords[i]) !== -1) {
        return robot.messageRoom(slackChannel.id, "El tonto de " + msg.message.user.name + " trató de usar @");
      }
    }

    return robot.messageRoom(slackChannel.id, ":speak_no_evil: *Un secreto:* " + secreto);
  });
};

