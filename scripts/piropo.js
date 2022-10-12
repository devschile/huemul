// Description:
//   Muestra al azar un piropo
//
// Dependencies:
//   None
//
// Configuration:
//   None
//
// Command:
//   hubot dame un piropo - Muestra al azar un piropo
//
// Author:
//   @edades

const piropos = [
  'Me gustaría ser papel para poder envolver ese bombón.',
  'Me gustaría ser un fósforo y que tú fueras una vela para verte derretir cuando te de candela.',
  'Me gustaría ser una gota de tu sangre, para recoger todo tu cuerpo y dormir en tu corazón.',
  'Me preguntaste qué era el amor y no te supe contestar. Ahora sé que es un sentimiento que no se puede dominar.',
  'Mi amor cuando se te enferman los ojos, ¿tú vas a un oftalmólogo o a una joyería?',
  'Por ti, subiría al cielo en bicicleta y bajaría sin frenos.',
  'Qué triste es el mundo sin un ser amado, pero más triste es tenerlo y no estar a su lado.',
  'Quién fuera agua para evaporarse, convertirse en nube y en invierno caer desde el cielo sobre tu cuerpo y recorrerlo por completo.',
  'Quiero volar sin alas y salir de este universo, entrar en el tuyo y amarte en silencio.',
  'Quisiera nacer de nuevo para no perderme ni uno solo de tus amaneceres.',
  'Deberías llamarte google, porque en ti está todo lo que busco.',
  'Quisiera ser Neumonía para quitarte cada aliento.',
  'Si yo fuera pollo y yo arroz, que rica sopa haríamos los dos.',
  'Si tus labios fueran miel, yo sería tu abeja.',
  'Estai más rico(a) que sopaipillas en domingo de lluvia.',
  'Me gustaría ser piñera para provocar un marepoto en tu corazón.',
  'Mijita(o) rica(o), corazón de alambre, te casai conmigo y te morí de hambre.',
  'Yo soy tu romeo, pero no santo.',
  'Cuanta carne! y yo vegano(a).',
  'Yo soy coca-cola y tú un hielito, si me tocas me derrito.'
]

module.exports = robot => {
  robot.respond(/dame un piropo/gi, msg => msg.send(`:huemul-love: _${msg.random(piropos)}_`))
}
