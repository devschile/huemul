// Description:
//   hubot sugiere algo para comer
//
// Dependencies:
//   None
//
// Configuration:
//   None
//
// Commands:
//   hubot qu[ée] desayunar|almorzar|cenar|tomar|comer
//
// Author:
//   @jorgeepunan

const desayuno = [
  'cereal',
  'sandwich',
  'frutas',
  'desayuno dominó',
  'quesillo + marmelada',
  'huevos',
  'lo mismo que ayer'
]
const almuerzo = [
  'pescado',
  'árabe',
  'thai',
  'india',
  'pastas',
  'sushi',
  'china',
  'sandwich',
  'empanada',
  'ensalada',
  'pizza',
  'chatarra',
  'ceviche',
  'carne/parrilla',
  'lo mismo que ayer'
]
const cena = [
  'carne',
  'pastas',
  'árabe',
  'thai',
  'india',
  'pizza',
  'sanguche',
  'lo mismo que ayer',
  'lasagna',
  'ceviche',
  'china'
]
const bebidas = [
  'cerveza',
  'agüita de hierba',
  'piscola',
  'roncola',
  'whiscola',
  'absenta',
  'pájaro verde',
  'vino tinto/blanco',
  'lo mismo que ayer nomás'
]
const cervezas = [
  'pale ale inglesa',
  'brown ale inglesa',
  'barley wine',
  'scottish ale',
  'ale belga',
  'trapense belga',
  'de abadía belga',
  'pilsner alemana/checa',
  'dunkel alemana/checa',
  'marzenbier alemana',
  'bock/doppelbock/maibock',
  'weizenbier alemana',
  'porter/stout',
  'su escudo nomás',
  'IPA',
  'APA (gringa)'
]

module.exports = robot => {
  robot.respond(/qu[ée] desayunar/gi, msg => msg.send(`Te sugiero: ${msg.random(desayuno)}`))

  robot.respond(/qu[ée] almorzar/gi, msg => msg.send(`Te sugiero: ${msg.random(almuerzo)}`))

  robot.respond(/qu[ée] cenar/gi, msg => msg.send(`Para el *anvre*: ${msg.random(cena)}`))

  robot.respond(/qu[ée] tomar/gi, msg => msg.send(`Si tienes sed: ${msg.random(bebidas)}`))

  robot.respond(/qu[ée] cerveza tomar/gi, msg => msg.send(`Si tienes sed: ${msg.random(cervezas)}`))

  robot.respond(/qu[ée] comer/gi, msg =>
    msg.send('Depende de la comida para: *desayunar*, *almorzar* ó *cenar*. Pregúntame de nuevo.')
  )
}
