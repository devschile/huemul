// Description:
//   laura pausini foto prohibida zentaurus taringa crack full
//
// Dependencies:
//   None
//
// Configuration:
//   None
//
// Commands:
//   hubot videla|taringa|pregunta - laura pausini foto prohibida zentaurus taringa crack full
//
// Author:
//   @eljojo

const rand = array => array[Math.floor(Math.random() * array.length)]

class Juliiiiiiito {
  constructor (msg) {
    this.lyrics = this.lyrics.bind(this)
    this.dondebuscar = this.dondebuscar.bind(this)
    this.persona_mujer = this.persona_mujer.bind(this)
    this.persona_hombre = this.persona_hombre.bind(this)
    this.persona_cualquiera = this.persona_cualquiera.bind(this)
    this.significado = this.significado.bind(this)
    this.preguntas_significado = this.preguntas_significado.bind(this)
    this.cosa_desconocida = this.cosa_desconocida.bind(this)
    this.usar_cosa_desconocida = this.usar_cosa_desconocida.bind(this)
    this.cosa_para_hacer = this.cosa_para_hacer.bind(this)
    this.tutorial = this.tutorial.bind(this)
    this.accion = this.accion.bind(this)
    this.lugar = this.lugar.bind(this)
    this.accion_una_persona_a_otra = this.accion_una_persona_a_otra.bind(this)
    this.hacer_pregunta = this.hacer_pregunta.bind(this)
    this.yapo = this.yapo.bind(this)
    this.msg = msg
  }

  lyrics () {
    return rand([
      'a ella le gusta la gasolina',
      'nada tiene de especial, dos mujeres que se dan la mano',
      'dansa cuduro',
      'por amarte asi cristian castro',
      'waka waka futbol',
      'israel, israel, que bonito es israel delfin hasta el fin',
      'maldita amiga no digas que no sientes nada',
      'son amores urbanos mekano regio',
      'cucurucucu paloma mekano',
      'mueve el ombligo mueve cristel'
    ])
  }

  dondebuscar () {
    return rand([
      'bajar arez',
      'bajar taringa',
      'karaoke erotico',
      'acordes guitarra',
      'karaoke',
      'en casete comprar',
      'vevo',
      'groovesharc',
      'sptify'
    ])
  }

  personaMujer () {
    return rand([
      'paty maldonado',
      'patti maldonado',
      'maria elena sweet',
      'camila vallejo',
      'kel kalderon',
      'rackel argandona',
      'karen paola',
      'gladys del rio',
      'gladys marin',
      'miriam hernandez',
      'karen paola',
      'bachelet',
      'bashele',
      'sarita vasquez',
      'daniela campos',
      'cecilia la imcomparable',
      'maria jose quintanilla',
      'cesilia boloco'
    ])
  }

  personaHombre () {
    return rand([
      'luciano bello',
      'tata pinocho',
      'chapulin colorado',
      'jaime gusman',
      'jose felisiano',
      'don fransisco',
      'peter roc',
      'pollo fuentes',
      'roberto carlos',
      'jorge pedreros',
      'antonio vodanovich',
      'badi richard',
      'lucho gatica',
      'zalo reyes',
      'luis fonsi',
      'alberto plaza',
      'felipito camiroaga',
      'puma rodriguez',
      'daniel samudio',
      'mauricio israel',
      'nelson avila',
      'zentaurus'
    ])
  }

  personaCualquiera () {
    return rand([this.personaMujer(), this.personaHombre(), this.msg.message.user.name])
  }

  significado () {
    return rand([
      'fake',
      'bacan',
      'choriflai',
      '< 3',
      'bellaka',
      'XD',
      'pelarse',
      'hipster',
      '1313',
      'por el chico no hay guagua',
      'estai papo'
    ])
  }

  preguntasSignificado () {
    return rand([
      'por que los niños dicen',
      'por que los lolos dicen',
      'que significa',
      'diccionario rae',
      'ejemplos de uso palabra',
      'como usar la palabra',
      'que significa cuando mi nieto dice'
    ])
  }

  cosaDesconocida () {
    return rand([
      'youtube',
      'twitter',
      'gmail',
      'fotolog',
      'metroflog',
      'maispace',
      'güatsap',
      'slack',
      'php',
      'javascrit',
      'acheteemele',
      'snapchatrs'
    ])
  }

  usarCosaDesconocida () {
    return rand(['como usar', 'que es un', 'como funciona el', 'como jotear lolitas en', 'donde esta el chat en'])
  }

  cosaParaHacer () {
    return rand([
      'hakear correo latinmail',
      'alejar a ex novio resentido',
      'hacer peinado Puma Rodriguez',
      'zurcir calcetines con el sexo',
      'curar la depresion inmediatamente',
      'borrar fondo de twiters donde salgo con una vieja fea',
      'orinar crescencios',
      'armar niño teleton',
      'escribir con las letras en grandecito',
      'poner la colita de chancho',
      'ponerle la cola al burro',
      'negar hijo en mapudungun',
      'cambiarle el color a #esto',
      'cocinar niñitos envueltos receta',
      'comprar disket',
      'mandar sms desde fono fax',
      'mandar watsap desde fono fax',
      'mandar foto del sexo por fono fax',
      'hacer un vampirito'
    ])
  }

  tutorial () {
    return rand(['tutorial taringa', 'tutorial paso a paso', 'guia con fotos', 'tutorial youtube', 'tutorial bananero'])
  }

  accion () {
    return rand([
      'cantando en el baño',
      'gritando en la alameda',
      'saludando a el presi',
      'con una gitana',
      'comiendo chumbeque',
      'camara lenta saltando',
      'presas',
      'bailando ganam stile',
      'haciendo el treque treque',
      'baile del pollito'
    ])
  }

  lugar () {
    return rand([
      'verano 94 pichidangui',
      'verano 83 cajon del maipo',
      'verano 43 plaza italia',
      'backstage venga conmigo',
      'detras de escenas cachureos',
      'evento anime 2004',
      'malón privada equipo mekano',
      `malón campo dichato de ${this.personaCualquiera()}`,
      'playa nudista miami',
      'festival de viña 74',
      'estudio de grabacion pase lo que pase',
      'detras de escena alo ely',
      'verano 2006 costa varua',
      'verano 97 cachagua',
      `cumpleaños 2000 ${this.personaCualquiera()}`,
      'ensayos japennin con já',
      'galpon persa biobio',
      'porlaputa',
      'la cuarta',
      'twitter',
      'slack',
      `#${this.msg.message.room}`
    ])
  }

  accionUnaPersonaAOtra () {
    return rand([
      'besando a',
      'entregando su flor',
      'fumando estragon',
      'haciendole los sexos',
      'haciendo el 69 con',
      'entregando su cuerpo a',
      'perdiendo virginidad',
      'fumando insienso con',
      'aspirando lysoform',
      'chocando el hueso',
      'haciendo un vampirito'
    ])
  }

  hacerPregunta () {
    return rand([
      `${this.usarCosaDesconocida()} ${this.cosaDesconocida()} pregunta`,
      `que significa "${this.msg.message.text}" pregunta`
    ])
  }

  // "#{@msg.message.text} #{@msg.message.user.name}"
  yapo () {
    return rand([
      `video prohibido ${this.personaCualquiera()} ${this.accion()} sin ropa online`,
      `fotos de ${this.msg.message.user.name} ${this.accion()} empelota`,
      `${this.lyrics()} ${this.dondebuscar()}`,
      `${this.personaHombre()} ${this.accionUnaPersonaAOtra()} ${this.personaMujer()} ${this.lugar()} video prohibido`,
      `${this.preguntasSignificado()} "${this.significado()}"`,
      `${this.usarCosaDesconocida()} ${this.cosa_desconocida()} pregunta`,
      `como ${this.cosaParaHacer()} ${this.tutorial()}`,
      `${this.personaCualquiera()} cantando ${this.lyrics()} ${this.lugar()}`,
      `que significa "${this.msg.message.text}" pregunta`
    ])
  }
}

module.exports = robot => {
  // robot.enter (msg) ->
  robot.respond(/(videla|taringa)/i, function (msg) {
    // console.log msg
    // msg.send msg.random enterReplies
    // msg.send "Bienvenido a *#{msg.message.room}*"
    const respuesta = new Juliiiiiiito(msg)
    msg.send(respuesta.yapo())
  })

  // tranquilein john wayne
  robot.respond(/pregunta/i, function (msg) {
    if (Math.random() * 10 > 7) {
      const respuesta = new Juliiiiiiito(msg)
      msg.send(respuesta.hacer_pregunta())
    }
  })
}
