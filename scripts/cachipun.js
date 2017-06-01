// Description:
//   Juega cachipún (piedra|papel|tijera) contra tu hubot
//
// Dependencies:
//   None
//
// Configuration:
//   None
//
// Commands:
//   hubot cachipun piedra|papel|tijera
//
// Author:
//   @jorgeepunan

var respuestas, 
    tipos;

tipos = {
  'piedra': {
    'papel': 'Papel envuelve piedra. Perdiste, LOSER.',
    'tijera': 'Piedra rompe tijera. ¡Ganaste! :wink:'
  },
  'papel': {
    'piedra': 'Papel envuelve piedra. Weeeena :ql: :wink:',
    'tijera': 'Tijera corta papel. ¡Chuuuuuuu!'
  },
  'tijera': {
    'papel': 'Tijeras cortan papel. ¡Súper! :wink:',
    'piedra': 'Piedra rompe tijera. ¡Amermelao :ql: !'
  }
};

respuestas = function(msg, userChoice) {

  var choice, choices, i, resultado, seleccion;
  choices = ['piedra', 'papel', 'tijera'];
  i = Math.floor(Math.random() * 3);
  choice = choices[i];
  seleccion = tipos[userChoice];

  if (seleccion[choice] != null) {
    resultado = tipos[userChoice][choice];
  } else {
    resultado = tipos[choice][userChoice];
  }
  if (!resultado) {
    resultado = "¡Empate!";
  }

  return msg.send(":huemul: escoge " + choice + " " + resultado);

};

module.exports = function(robot) {

  return robot.respond(/cachipun (piedra|papel|tijera)/i, function(msg) {
    var userChoice;
    userChoice = msg.match[1].toLowerCase();
    return respuestas(msg, userChoice);
  });
  
};
