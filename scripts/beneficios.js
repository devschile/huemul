// Description:
//   Beneficios: :huemul: es el mejor jefe y nos entrega un beneficio a la vez.
//
// Dependencies:
//   None
//
// Configuration:
//   None
//
// Commands:
//   hubot un beneficio - Retorna un beneficio otorgado por :huemul:
//
// Author:
//   @juanbrujo

var beneficios = [
  'Tómate la tarde libre, proletario.',
  '¡4 semanas de vacaciones pagadas!',
  'Escoje el computador y la silla que quieras.',
  'Snacks, café, frutas y bebidas libre todos los días todo el día.',
  'Aguinaldo en septiembre y diciembre.',
  'Bono anual por metas cumplidas.',
  'Seguro de salud y dental para ti y tu familia.',
  'Bono anual sólo por ser un :huemul: dev y/o golden :monea:',
  'Permisos para celebrar y compartir la :beerjs:'
]

module.exports = function (robot) {
  robot.respond(/un beneficio/gi, function (res) {
    res.send(res.random(beneficios))
  })
}
