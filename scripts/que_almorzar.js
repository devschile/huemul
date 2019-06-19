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
//   hubot que puedo desayunar - Retorna una sugerencia para desayunar
//   hubot que puedo almorzar - Retorna una sugerencia para almorzar
//   hubot que puedo cenar - Retorna una sugerencia para cenar
//   hubot que puedo tomar - Retorna una sugerencia para tomar
//   hubot que puedo comer - Retorna una sugerencia para comer
//   hubot que me sugieres para desayunar - Retorna una sugerencia para desayunar
//   hubot que me sugieres para almorzar - Retorna una sugerencia para almorzar
//   hubot que me sugieres para cenar - Retorna una sugerencia para cenar
//   hubot que me sugieres para tomar - Retorna una sugerencia para tomar
//   hubot que me sugieres para comer - Retorna una sugerencia para comer
//
// Author:
//   @jorgeepunan
//
// Colaborator:
//   @madkoding

const kinds = {
  desayuno: [
    'Cereal',
    'Sandwich',
    'Frutas',
    'Desayuno en el dominó',
    'Quesillo + mermelada',
    'Huevos',
    'lo mismo que ayer'
  ],
  almuerzo: [
    'Pescado',
    'Comida Árabe',
    'Comida Thai',
    'Comida India',
    'Pastas',
    'Sushi',
    'Comida China',
    'Sandwich',
    'Empanada',
    'Ensalada',
    'Pizza',
    'Comida Chatarra',
    'Ceviche',
    'Carne/Parrilla',
    'lo mismo que ayer'
  ],
  cena: [
    'Carne',
    'Pastas',
    'Comida Árabe',
    'Comida Thai',
    'Comida India',
    'Pizza',
    'Sanguche',
    'Lasagna',
    'Ceviche',
    'Comida China',
    'lo mismo que ayer'
  ],
  bebidas: [
    'Cerveza',
    'Agüita de hierba',
    'Piscola',
    'Roncola',
    'Whiscola',
    'Absenta',
    'Pájaro verde',
    'Vino tinto/blanco',
    'lo mismo que ayer nomás'
  ],
  cervezas: [
    'Pale Ale inglesa',
    'Brown Ale inglesa',
    'Barley Wine',
    'Scottish Ale',
    'Ale belga',
    'Trapense belga',
    'de abadía belga',
    'Pilsner alemana/checa',
    'Dunkel alemana/checa',
    'Marzenbier alemana',
    'Bock/Doppelbock/Maibock',
    'Weizenbier alemana',
    'Porter/Stout',
    'Su escudo nomás',
    'IPA',
    'APA (gringa)'
  ]
}

attachResponse = (kind, msg) => {
  let title = ''
  switch (kind) {
    case 'desayuno':
    case 'almuerzo':
      title = 'te sugiero:'
      break
    case 'cena':
      title = 'para el *anvre*:'
      break
    case 'bebidas':
    case 'cervezas':
      title = 'si tienes sed:'
      break
  }

  const foodType = msg.random(kinds[kind])
  const userName = msg.message.user.name
  const attachment = {
    attachments: [
      {
        fallback: `${userName} ${title} ${foodType}`,
        color: '#36a64f',
        text: `${userName} ${title}`,
        fields: [
          {
            title: `${foodType}`
          }
        ],
        footer: 'Come saludable'
      }
    ]
  }
  return msg.send(attachment)
}

module.exports = robot => {
  robot.respond(/qu[ée] (puedo |(?:me )?sugieres (?:para |de )?)?(desayunar|desayuno)/gi, msg =>
    attachResponse('desayuno', msg)
  )
  robot.respond(/qu[ée] (puedo |(?:me )?sugieres (?:para |de )?)?(almorzar|almuerzo)/gi, msg =>
    attachResponse('almuerzo', msg)
  )
  robot.respond(/qu[ée] (puedo |(?:me )?sugieres (?:para |de )?)?(cenar|cena)/gi, msg => attachResponse('cena', msg))
  robot.respond(/qu[ée] (puedo |(?:me )?sugieres (?:para |de )?)?tomar/gi, msg => attachResponse('bebidas', msg))
  robot.respond(/qu[ée] cerveza (puedo |(?:me )?sugieres (?:para |de )?)?tomar/gi, msg =>
    attachResponse('cervezas', msg)
  )

  robot.respond(/qu[ée] (puedo |(?:me )?sugieres (?:para |de )?)?comer/gi, msg =>
    msg.send('Depende de la comida para: *desayunar*, *almorzar* ó *cenar*. Pregúntame de nuevo.')
  )
}
