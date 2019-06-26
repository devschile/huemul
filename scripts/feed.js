// Description:
//   Alimenta a Huemul con el alimento que prefieras para que siga funcionando.
//
// Dependencies:
//   None
//
// Configuration:
//   None
//
// Commands:
//   hubot toma|come|alimentate|traga|engulle <food|emoji> - Alimenta a :huemul:
//
// Author:
//   @ravenous <hello@ravenous.io>

const hungry = [
  'Ahhh! Un manjarsh!',
  'Gracias! Me moría de hambre',
  'Ñam ñam ñam~ :yum:',
  'Por fin alguien se digna a alimentarme! :clap:'
]
const satisfied = [
  'No puedo más, mi barriga va a explotar!',
  'No gracias, ya estoy llenito! :relaxed:',
  '¿Me estás haciendo engordar? :anguished:'
]
const taste = [
  '¿Cómo se te ocurre que comeré eso? :triumph:',
  '¿Mamá? ¡¿Eres tú?! :cry:',
  'Deberías buscar hervíboro en Google :unamused:'
]
const blacklist = ['pudu', 'carne', 'pollo', 'caca', ':meat_on_bone:', ':pultry_leg:', ':egg:', ':hamburger:']

module.exports = robot => {
  robot.respond(/(?:toma|come|alimentate|traga|engulle)\s(\w+)/i, res => {
    const food = res.match[1]
    const foodHad = robot.brain.get('totalFood') * 1 || 0
    if (blacklist.includes(food)) res.send(res.random(taste))
    if (foodHad > 3) {
      res.send(res.random(satisfied))
    } else {
      res.send(res.random(hungry))
      robot.brain.set('totalFood', foodHad + 1)
    }
  })
}
