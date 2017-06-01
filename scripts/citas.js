// Description:
//   Selecciona al azar entre 29 buenas citas inspiradoras
//
// Dependencies:
//   None
//
// Configuration:
//   None
//
// Commands:
//   huemul una cita
//
// Author:
//   @jorgeepunan

const citas = [
  '> Lo bien hecho es mejor que lo bien dicho. *-Benjamin Franklin*',
  '> Un buen diseño es un buen negocio. *-Thomas Watson, Jr*',
  '> La actitud es una pequeña cosa que hace una gran diferencia. *-Winston Churchill*',
  '> Yo no soy un producto de mis circunstancias. Soy un producto de mis decisiones. *-Stephen Covey*',
  '> Cada niño es un artista. El problema es cómo seguir siendo artista una vez que se crece. *-Pablo Picasso*',
  '> Nunca se puede cruzar el océano hasta que tenga el coraje de perder de vista la costa. *-Cristóbal Colón*',
  '> He aprendido que la gente olvidará lo que dijiste, la gente olvidará lo que hiciste, pero las personas nunca olvidarán cómo los hiciste sentir. *-Maya Angelou*',
  '> Tanto si piensas que puedes o piensas que no puedes, tienes razón. *-Henry Ford*',
  '> Los dos días más importantes en su vida son los días que se nace y el día que se descubre por qué. *-Mark Twain*',
  '> Lo que puedas hacer o soñar, ponte a hacerlo. La osadía está llena de genialidad, poder y magia. *-Johann Wolfgang von Goethe*',
  '> La mejor venganza es el éxito masivo. *-Frank Sinatra*',
  '> La gente suele decir que la motivación no dura mucho. Bueno, tampoco lo hace la ducha -por eso la recomendamos a diario. *-Zig Ziglar*',
  '> La inspiración existe, pero tiene que encontrarte trabajando. *-Pablo Picasso*',
  '> Cualquiera que sea la mente del hombre puede concebir y creer, puede lograr. *-Napoleón Hill*',
  '> Su tiempo es limitado, así que no lo desperdicien viviendo la vida de otra persona. *-Steve Jobs*',
  '> Esfuérzate por no ser un éxito, sino más bien para ser de valor. *-Albert Einstein*',
  '> Dos caminos se bifurcaban en un bosque, y yo tomé el menos transitado, y eso ha hecho toda la diferencia. *-Robert Frost*',
  '> Si lo puedes soñar, lo puedes hacer. *-Walt Disney*',
  '> He fallado más de 9000 tiros en mi carrera. He perdido casi 300 juegos. He fallado una y otra y otra vez en mi vida. Y es por eso que tengo éxito. *-Michael Jordan*',
  '> Cada golpe me acerca a la próxima carrera de casa. *-Babe Ruth*',
  '> El propósito es el punto de partida de todo logro. *-W. Clement Stone*',
  '> La vida es lo que te pasa mientras estás ocupado haciendo otros planes. *-John Lennon*',
  '> Nos convertimos en lo que pensamos. *-Earl Nightingale*',
  '> Dentro de veinte años estarás más decepcionado por las cosas que no hiciste que por las que hiciste, así que suelta las amarras, vela lejos del puerto seguro y captura de los vientos alisios en tus velas. Explora, Sueña y descubre. *-Mark Twain*',
  '> La vida es 10% lo que me pasa y el 90% de cómo reacciono a ello. *-John Maxwell*',
  '> Si haces lo que siempre has hecho, obtendrás lo que siempre has conseguido. *-Tony Robbins*',
  '> La mente lo es todo. ¿En qué crees que te convertirás?. *-Buddha*',
  '> El mejor momento para plantar un árbol fue hace 20 años. El segundo mejor momento es ahora. *-Proverbio Chino*',
  '> No vale la pena vivir una vida poco examinada. *-Sócrates*',
  '> El ochenta por ciento del éxito está apareciendo. *-Woody Allen*',
  '> No espere. El tiempo nunca será justo. *-Napoleón Hill*',
  '> Ganar no lo es todo, pero el deseo de ganar si lo es. *-Vince Lombardi*'
];

module.exports = function(robot) {
  return robot.respond(/una cita/i, msg => msg.send( msg.random(citas) ));
};

