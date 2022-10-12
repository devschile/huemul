// Description:
//   Entrega el Índice Lasagna del momento para que tomes mejores decisiones.
//
// Dependencies:
//   None
//
// Commands:
//   hubot lasagnaindex - Te entrega tu Índice Lasagna del momento.
//   hubot lasañaindex - Te entrega tu Índice Lasagna del momento.
//
// Author:
//   @jorgeepunan

const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1) + min)

function makeDecision (name, number) {
  const intro = `:lasagnita-feliz: Tu _${name}_ es *${number}*.`
  if (number >= -10 && number <= -7) {
    return `${intro} Todo comenzará a explotar :boom: ándate pa la casa cuanto antes.`
  } else if (number >= -6 && number <= -4) {
    return `${intro} Tendrás problemas pronto, ponte altiro una armadura :shield:`
  } else if (number >= -3 && number <= -1) {
    return `${intro} Se pondrá todo aburrido, mejor toma una siesta :perrosleep: en el baño.`
  } else if (number === 0) {
    return `${intro} *NADA* interesante sucederá al corto plazo. Considera una excusa y pa la casa :bed:`
  } else if (number >= 1 && number <= 3) {
    return `${intro} Misma rutina, mismos problemas. :dev: Poca acción.`
  } else if (number >= 4 && number <= 6) {
    return `${intro} Llegará un desafío, ánimo a sacarlo bien y lucirte. Además, puede que hagas match :tinder:`
  } else if (number >= 7 && number <= 10) {
    return `${intro} :sparkles: Ahora todo va a ser a toda zorra, vive cada minuto como si fuera el último :sparkles:`
  }
}

module.exports = robot => {
  robot.respond(/lasa(gn|ñ)aindex/i, msg => {
    const name = msg.match[0].split(' ')[1]
    msg.send(`*${msg.message.user.name}*: ${makeDecision(name, getRandomInt(-10, 10))}`)
  })
}
