// Description:
//   Muestra al azar una frase de galleta de la fortuna
//
// Dependencies:
//   None
//
// Configuration:
//   None
//
// Command:
//   huemul dame una fortuna
//
// Author:
//   @jorgeepunan

const fortunes = [
  'Tendrás un día de alegrías y buenos momentos, disfrútalos como nunca.',
  'Concéntrate en lo que quieres lograr y ganarás. No lo olvides.',
  'El cielo será tu límite, pues grandes acontecimientos te sucederán.',
  'Te sentirás feliz como un niño y verás al mundo con sus ojos.',
  'Vivirás tu vejez con comodidades y riquezas materiales.',
  'Confía en tu suerte, que es mucha y te rodeará de prosperidad.',
  'No todo el mundo puede recibir las mismas cosas. Sé práctico.',
  'Te aguarda una larga y feliz vida.',
  'Hoy es el momento de explorar: no temas.',
  'Muy pronto serás incluído en muchas reuniones, fiestas y tertulias.',
  'Cuando busques lo que mas deseas, recuerda hacer tu mejor esfuerzo.',
  'Tienes por delante un maravilloso día para triunfar; disfrútalo y compártelo.',
  'Hoy serás reconocido por tus dones especiales y lograrás ser feliz por muchas horas.',
  'Tu corazón estallará de alegría con la llegada de buenas noticias.',
  'Mañana puede ser muy tarde para disfrutar lo que tienes hoy.',
  'Serás promovido en tu trabajo debido a tus logros y capacidades.',
  'Alégrate, un camino de hermosas pasiones te espera y debes transitarlo.',
  'Nunca tendrás que preocuparte por un ingreso estable.',
  'Hoy tendrás un día de increíble alegría y brillará tu sentido del humor.',
  'Hoy compartirás las horas más tiernas de tu vida con alguien muy amado.',
  'La rueda de la fortuna te favorecerá y estarás rodeado de prosperidad.',
  'Tendrás entera satisfacción al final de esta temporada. Prepárate.',
  'Muchos se alegraran por tus logros y a ti te mejorara la vida.',
  'Eres una persona a la que le gusta triunfar en la vida.',
  'Confía en tu buen juicio y verás que este te lleva al triunfo.',
  'Se te cumplirá un hermoso sueño y verás como otros sueños se hacen realidad.',
  'No olvides que un amigo es un regalo que te das a ti mismo.',
  'Sabes que es exactamente lo que quieres. Trabaja en ello y hazlo materializarse.',
  'Siente la felicidad que espera por ti y no olvides atraparla para mantenerla contigo.'
]

module.exports = robot => {
  robot.respond(/dame una fortuna/gi, msg => msg.send(`:fortune_cookie: *${msg.message.user.name}* ${msg.random(fortunes)}`))
}
