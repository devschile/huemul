// Description
//   Hubot votador
//
// Dependencies:
//   None
//
// Configuration:
//   None
//
// Commands:
//   hubot votador help
//   hubot inicio votador item1, item2, item3, ...
//   hubot voto (por) N ~ donde N es el índice de la opción
//   hubot opciones votador
//   hubot conteo votador
//   hubot fin votador
//
// Notes:
//   Base: https://github.com/joshingly/hubot-voting/blob/master/src/scripts/voting.coffee
//
// Author:
//   @antonishen
//   @juanbrujo

module.exports = robot => {
  let tallyVotes;
  robot.voting = {};

  robot.respond(/inicio votador (.+)$/i, function(msg) {

    if (robot.voting.votes != null) {
      msg.send("Ya existe votación vigente");
      return sendChoices((msg));
    } else {
      robot.voting.votes = {};
      createChoices(msg.match[1]);

      msg.send("Comienza votación. Recuerda que para votar tienes que escribir `huemul voto [opción].`");
      return sendChoices(msg);
    }
  });

  robot.respond(/fin votador/i, function(msg) {
    if (robot.voting.votes != null) {

      let results = tallyVotes();

      let response = "Resultados votación...";
      for (let index = 0; index < robot.voting.choices.length; index++) {
        let choice = robot.voting.choices[index];
        response += `\n - Opción ${index}: ${choice}: ${results[index]} votos (${Math.round((results[index] * 100) / results.reduce((t, s) => t + s))}%)`;
      }

      msg.send(response);

      delete robot.voting.votes;
      return delete robot.voting.choices;
    } else {
      return msg.send("No hay votador vigente");
    }
  });


  robot.respond(/opciones votador/i, msg => sendChoices(msg));

  robot.respond(/votador help/i, function(msg) {
    msg.send("*Comandos:*");
    return msg.send(`Crear votación: \`huemul inicio votador item1, item2, item3, ...\`\n \
Votar: \`huemul voto (por) N\` ~ donde N es el índice de la opción\n \
Mostrar Opciones: \`huemul opciones votador\`\n \
Mostrar conteo de votos actual: \`huemul conteo votador\`\n \
Finalizar votación: \`huemul fin votador\``
    );
  });

  robot.respond(/conteo votador/i, function(msg) {
    let results = tallyVotes();
    return sendChoices(msg, results);
  });

  robot.respond(/voto (por )?(.+)$/i, function(msg) {
    let choice = null;

    let re = /\d{1,2}$/i;
    if (re.test(msg.match[2])) {
      choice = parseInt(msg.match[2], 10);
    } else {
      choice = robot.voting.choices.indexOf(msg.match[2]);
    }

    let sender = robot.brain.usersForFuzzyName(msg.message.user['name'])[0].name;

    if (validChoice(choice)) {
      robot.voting.votes[sender] = choice;
      return msg.send(`${sender} vota por opción ${choice}: ${robot.voting.choices[choice]}`);
    } else {
      return msg.send(`${sender}: esa no es una opción válida`);
    }
  });

  var createChoices = rawChoices => robot.voting.choices = rawChoices.split(/,/);

  var sendChoices = function(msg, results = null) {

    let response;
    if (robot.voting.choices != null) {
      response = "";
      for (let index = 0; index < robot.voting.choices.length; index++) {
        let choice = robot.voting.choices[index];
        response += ` - Opción ${index}: ${choice}`;
        if (results != null) {
          response += ` -- Total votos: ${results[index]}`;
        }
        if (index !== (robot.voting.choices.length - 1)) { response += "\n"; }
      }
    } else {
      msg.send("No existe votación vigente");
    }

    return msg.send(response);
  };

  var validChoice = function(choice) {
    if (!robot.voting.choices) { return false; }
    let numChoices = robot.voting.choices.length - 1;
    return 0 <= choice && choice <= numChoices;
  };

  return tallyVotes = function() {
    let choice;
    let results = ((() => {
      let result = [];
      for (choice of Array.from(robot.voting.choices)) {         result.push(0);
      }
      return result;
    })());

    let voters = Object.keys(robot.voting.votes);
    for (let voter of Array.from(voters)) {
      choice = robot.voting.votes[voter];
      results[choice] += 1;
    }

    return results;
  };
};
