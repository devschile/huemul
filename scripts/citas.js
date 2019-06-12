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

const avatars = new Map([
  ['default', 'https://i.imgur.com/vxt1YzX.jpg'],
  ['Benjamin Franklin', 'https://i.imgur.com/APiwXqY.jpg'],
  ['Thomas Watson, Jr', 'https://i.imgur.com/KCh7Hhh.jpg'],
  ['Winston Churchill', 'https://i.imgur.com/F9jMOyt.jpg'],
  ['Stephen Covey', 'https://i.imgur.com/dFMUcY4.jpg'],
  ['Pablo Picasso', 'https://i.imgur.com/hTwVptW.jpg'],
  ['Cristóbal Colón', 'https://i.imgur.com/eQTEf4r.jpg'],
  ['Maya Angelou', 'https://i.imgur.com/Wh0Kfu6.jpg'],
  ['Henry Ford', 'https://i.imgur.com/VV28PF4.jpg'],
  ['Mark Twain', 'https://i.imgur.com/GmHmvI0.jpg'],
  ['Johann Wolfgang von Goethe', 'https://i.imgur.com/IffRZFV.jpg'],
  ['Frank Sinatra', 'https://i.imgur.com/EkSw2mz.jpg'],
  ['Zig Ziglar', 'https://i.imgur.com/zSuChkq.png'],
  ['Napoleón Hill', 'https://i.imgur.com/lgJ9BUe.jpg'],
  ['Steve Jobs', 'https://i.imgur.com/ST6aDAa.jpg'],
  ['Albert Einstein', 'https://i.imgur.com/kIMvg3W.jpg'],
  ['Robert Frost', 'https://i.imgur.com/lAMcVBu.jpg'],
  ['Walt Disney', 'https://i.imgur.com/GdqNSaG.jpg'],
  ['Michael Jordan', 'https://i.imgur.com/9MgsmbQ.jpg'],
  ['Babe Ruth', 'https://i.imgur.com/URWxxUK.jpg'],
  ['W. Clement Stone', 'https://i.imgur.com/oLr4CMn.jpg'],
  ['John Lennon', 'https://i.imgur.com/RaygDJL.jpg'],
  ['Earl Nightingale', 'https://i.imgur.com/UEZKt6i.jpg'],
  ['John Maxwell', 'https://i.imgur.com/sWRd8Sa.jpg'],
  ['Tony Robbins', 'https://i.imgur.com/bjpZCFN.jpg'],
  ['Buddha', 'https://i.imgur.com/MBgYq56.jpg'],
  ['Proverbio Chino', 'https://i.imgur.com/41YRptw.jpg'],
  ['Sócrates', 'https://i.imgur.com/X3UmVc8.jpg'],
  ['Woody Allen', 'https://i.imgur.com/gzzagUT.jpg'],
  ['Vince Lombardi', 'https://i.imgur.com/WLh9rIs.jpg'],
])
const quotes = [
  { quote: 'Lo bien hecho es mejor que lo bien dicho.', author: 'Benjamin Franklin' },
  { quote: 'Un buen diseño es un buen negocio.', author: 'Thomas Watson, Jr' },
  { quote: 'La actitud es una pequeña cosa que hace una gran diferencia.', author: 'Winston Churchill' },
  { quote: 'Yo no soy un producto de mis circunstancias. Soy un producto de mis decisiones.', author: 'Stephen Covey' },
  { quote: 'Cada niño es un artista. El problema es cómo seguir siendo artista una vez que se crece.', author: 'Pablo Picasso' },
  { quote: 'Nunca se puede cruzar el océano hasta que tenga el coraje de perder de vista la costa.', author: 'Cristóbal Colón' },
  { quote: 'He aprendido que la gente olvidará lo que dijiste, la gente olvidará lo que hiciste, pero las personas nunca olvidarán cómo los hiciste sentir.', author: 'Maya Angelou' },
  { quote: 'Tanto si piensas que puedes o piensas que no puedes, tienes razón.', author: 'Henry Ford' },
  { quote: 'Los dos días más importantes en su vida son los días que se nace y el día que se descubre por qué.', author: 'Mark Twain' },
  { quote: 'Lo que puedas hacer o soñar, ponte a hacerlo. La osadía está llena de genialidad, poder y magia.', author: 'Johann Wolfgang von Goethe' },
  { quote: 'La mejor venganza es el éxito masivo.', author: 'Frank Sinatra' },
  { quote: 'La gente suele decir que la motivación no dura mucho. Bueno, tampoco lo hace la ducha -por eso la recomendamos a diario.', author: 'Zig Ziglar' },
  { quote: 'La inspiración existe, pero tiene que encontrarte trabajando.', author: 'Pablo Picasso' },
  { quote: 'Cualquiera que sea la mente del hombre puede concebir y creer, puede lograr.', author: 'Napoleón Hill' },
  { quote: 'Su tiempo es limitado, así que no lo desperdicien viviendo la vida de otra persona.', author: 'Steve Jobs' },
  { quote: 'Esfuérzate por no ser un éxito, sino más bien para ser de valor.', author: 'Albert Einstein' },
  { quote: 'Dos caminos se bifurcaban en un bosque, y yo tomé el menos transitado, y eso ha hecho toda la diferencia.', author: 'Robert Frost' },
  { quote: 'Si lo puedes soñar, lo puedes hacer.', author: 'Walt Disney' },
  { quote: 'He fallado más de 9000 tiros en mi carrera. He perdido casi 300 juegos. He fallado una y otra y otra vez en mi vida. Y es por eso que tengo éxito.', author: 'Michael Jordan' },
  { quote: 'Cada golpe me acerca a la próxima carrera de casa.', author: 'Babe Ruth' },
  { quote: 'El propósito es el punto de partida de todo logro.', author: 'W. Clement Stone' },
  { quote: 'La vida es lo que te pasa mientras estás ocupado haciendo otros planes.', author: 'John Lennon' },
  { quote: 'Nos convertimos en lo que pensamos.', author: 'Earl Nightingale' },
  { quote: 'Dentro de veinte años estarás más decepcionado por las cosas que no hiciste que por las que hiciste, así que suelta las amarras, vela lejos del puerto seguro y captura de los vientos alisios en tus velas. Explora, Sueña y descubre.', author: 'Mark Twain' },
  { quote: 'La vida es 10% lo que me pasa y el 90% de cómo reacciono a ello.', author: 'John Maxwell' },
  { quote: 'Si haces lo que siempre has hecho, obtendrás lo que siempre has conseguido.', author: 'Tony Robbins' },
  { quote: 'La mente lo es todo. ¿En qué crees que te convertirás?.', author: 'Buddha' },
  { quote: 'El mejor momento para plantar un árbol fue hace 20 años. El segundo mejor momento es ahora.', author: 'Proverbio Chino' },
  { quote: 'No vale la pena vivir una vida poco examinada.', author: 'Sócrates' },
  { quote: 'El ochenta por ciento del éxito está apareciendo.', author: 'Woody Allen' },
  { quote: 'No espere. El tiempo nunca será justo.', author: 'Napoleón Hill' },
  { quote: 'Ganar no lo es todo, pero el deseo de ganar si lo es.', author: 'Vince Lombardi' }
];

module.exports = function(robot) {
  return robot.respond(/una cita/i, msg => {
    /**
     * @param {string} iconUrl
     * @param {string} quote
     */
    const send = (iconUrl, quote) => {
      if (['SlackBot', 'Room'].includes(robot.adapter.constructor.name)) {
        const options = {
          as_user: false,
          link_names: 1,
          icon_url: iconUrl,
          username: author,
          unfurl_links: false,
          attachments: [{
            fallback: quote,
            text: quote,
            color: 'info',
          }]
        }
        robot.adapter.client.web.chat.postMessage(msg.message.room, null, options)
      } else {
        msg.send(`> ${quote}`)
      }
    }
    const { quote, author } = msg.random(quotes)
    const iconUrl = avatars.has(author) ? avatars.get(author) : avatars.get('default')
    send(iconUrl, quote)
  });
};
