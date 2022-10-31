// Description:
//   Listado de beneficios conseguidos para la comunidad devsChile
//
// Dependencies:
//   None
//
// Configuration:
//   None
//
// Commands:
//   hubot beneficios - Devuelve lista de beneficios para la comunidad devsChile
//
// Author:
//   @hectorpalmatellez

const beneficios = [
  'Cafetalero.cl - cupón `devsChile` 15% de descuento en primera compra',
  'Boolean.cl - 15% de descuento en cualquier curso para miembros de devsChile'
]

module.exports = robot => {
  robot.respond(/beneficios/i, msg => {
    beneficios.map(beneficio => {
      msg.send(beneficio)
    })
  })
}
