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
//   un beneficio

var beneficios = [
  'Tómate la tarde libre, proletario.',
  '¡4 semanas de vacaciones pagadas!',
  'Escoje el computador y la silla que quieras.',
  'Snacks, café, frutas y bebidas libre todos los días todo el día.',
  'Aguinaldo en septiembre y diciembre.',
  'Bono anual por metas cumplidas.',
  'Seguro de salud y dental para tí y tu familia.'
];

module.exports = function(robot) {
  robot.respond(/un beneficio/gi, function(res) {
    res.send( beneficios[Math.floor(Math.random() * beneficios.length)] );
  });
};
