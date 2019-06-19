// Description:
//   Siglas a un nombre / palabra de no + de 16 caracteres de largo
//
// Dependencies:
//   none
//
// Configuration:
//   none
//
// Commands:
//   hubot siglas <texto> - Muestra las siglas a un texto
//
// Author:
//   @jorgeepunan

module.exports = function(robot) {
  robot.respond(/siglas (.*)/i, function(msg) {
    /**
     * @param {Array<string>} array - Array of words.
     * @returns {string} - A uniq random word.
     */
    const rand = array => {
      const index = Math.floor(Math.random() * array.length)
      const [removed] = array.splice(index, 1)
      return removed
    }

    const input = msg.match[1]
    const maxChars = 16

    if (input.replace(/\s/g, '').length > maxChars) {
      msg.send(`Loco, no weís, máximo ${maxChars} caracteres. :loco2:`)
    } else {
      const letters = new Map([
        [
          'a',
          [
            'Amoroso',
            'Amable',
            'Animal',
            'Amigo',
            'Angel',
            'Ábil',
            'Author',
            'a esta ora salen duendes',
            'Aver',
            'Agraciado'
          ]
        ],
        [
          'b',
          [
            'Bello',
            'Bellako',
            'Bestia',
            'Burro',
            'Bacán',
            'Borracho',
            'Bakén',
            'Beodo',
            'Bruto',
            'Becker',
            'Barticciotto',
            'bbcito',
            'vueno',
            'Bonito',
            'Bacano',
            'Bizarro',
            'Bienaventurado'
          ]
        ],
        [
          'c',
          [
            'Cómodo',
            'Corredor',
            'Camarero',
            'Choriflai',
            'Creativo',
            'Cerati',
            'Clamidia',
            'Cristo',
            'Cristiano',
            'Callate',
            'Cocoliso',
            'Carero',
            'Cejón',
            'Caballero'
          ]
        ],
        [
          'd',
          [
            'Diputado',
            'Dije',
            'Desainer',
            'Doppelganger',
            'Druida',
            'Dramático',
            'Dragqueen',
            'Duqueso',
            'Duquesa',
            'Dinámico',
            'Duro'
          ]
        ],
        [
          'e',
          [
            'Enfermo',
            'Erótico',
            'Ex',
            'Enérgico',
            'Estel',
            'Ermético',
            'Eléctrico',
            'Ermantraut',
            'each',
            'Estirado',
            'Estúpido',
            'Elegante',
            'Entusiasta'
          ]
        ],
        [
          'f',
          [
            'Fornido',
            'Fake',
            'Fronén',
            'Feo',
            'Fail',
            'for',
            'Florero',
            'Firme',
            'Fuerte',
            'Fornai',
            'FPMR',
            'Fantastico',
            'Florerito',
            'Fino',
            'Fanfarrón',
            'Fundío'
          ]
        ],
        [
          'g',
          [
            'Güiña',
            'Grande',
            'Gitano',
            'Glorioso',
            'Glamoroso',
            'Great',
            'Gigante',
            'Germano',
            'Golazo',
            'García-Marquez',
            'Gonzaleeeeeee',
            'Glande',
            'Guatón',
            'Generoso',
            'Groupie',
            'Ganoso'
          ]
        ],
        [
          'h',
          [
            'Huaso',
            'Hipster',
            'Haker',
            'Hacker',
            'Horneado',
            'H-H',
            'Help',
            'Hartista',
            'Helicóptero',
            'http',
            'https',
            'HABER',
            'Húmedo',
            'Hocicón',
            'Histriónico'
          ]
        ],
        ['i', ['Inútil', 'Indigente', 'Iluso', 'Inspirado', 'Ileal', 'Inti-illimani', 'Iris', 'Iriólogo', 'Ilustrado']],
        [
          'j',
          ['Jarcor', 'jQuery', 'Jueves', 'Jal Berry', 'Jueeeee', 'Jaimito el cartero', 'Jorge', 'Juvenil', 'Jovial']
        ],
        ['k', ['Kulero', 'Kuin', 'K.O.', 'Kween', 'Kast', 'K PASA KING', 'King', 'Kawinero', 'Kiwi', 'Killer']],
        [
          'l',
          [
            'Lorea',
            'Lolein',
            'Lais',
            'Llanto',
            'Loquendo',
            'Lavadora',
            'Lobezno',
            'Leonidas',
            'La gran magia tropical',
            'Lunático',
            'Loco',
            'Lautaro',
            'Lela',
            'Leso'
          ]
        ],
        [
          'm',
          [
            'Machucao',
            'Maldito',
            'Músico',
            'Mariwanero',
            'Micrero',
            'Marcelo Cachureos',
            'MIR',
            'Modelo',
            'Marinero',
            'Marico',
            'Mon amour',
            'Mamahuevo',
            'Misceláneo',
            'Macanudo'
          ]
        ],
        [
          'n',
          [
            'Nerd',
            'Nudista',
            'NaN',
            'Nada nuevo bajo el sol',
            'No',
            'Nube',
            'Nadien',
            'Nobody',
            'Nuesni',
            'Nonato',
            'Narigón',
            'Netflix',
            'Ni fu ni fa',
            'Naranjo',
            'Nominal'
          ]
        ],
        ['ñ', ['Ñoño', 'Ñandú', 'Ñeeeeee', 'Ñau uwu', 'Ñato', 'Ñandu']],
        [
          'o',
          [
            'Odioso',
            'Otaco',
            'owo',
            'otro framework de js',
            'Onvre',
            'Orrible',
            'Otra vez?',
            'Orma del zapato',
            'OH MY GOD',
            'Ojo',
            'Ojeroso',
            'Ostentoso',
            'Onomatopéyico'
          ]
        ],
        [
          'p',
          [
            'Peante',
            'Pollo',
            'Pentest',
            'PHP',
            'Principe',
            'Probeta',
            'Provocame mujer',
            'Prince Royce',
            'Pablito Ruiz',
            'Principe del rap',
            'Provida',
            'Promuerte',
            'Pluscuamperfecto',
            'Penetrador',
            'Patudo',
            'Peon',
            'Plebeyo'
          ]
        ],
        [
          'q',
          [
            'Querido',
            'Quizás',
            'Quilapayun',
            'Que queris ctm',
            'Quelentaro',
            'Quishpue',
            'QUÉ',
            'Quien es la que viene allí tan bonita y tan gentil',
            'Q(o_oQ)',
            'Que te pasa'
          ]
        ],
        [
          'r',
          [
            'Ronrronero',
            'Rellenito',
            'Regio',
            'Roto',
            'Raúl',
            'Rock',
            'ROOOOCK!',
            'ROOOOOCK |mL',
            'Rata',
            'Ratero',
            'Ruperto',
            'Rastrero'
          ]
        ],
        [
          's',
          [
            'Sapo',
            'Sagaz',
            'Sutil',
            'Superbonito',
            'Suelta el whatsapp $:',
            'Sapa',
            'Sapolio',
            'Si supieras',
            'SAL',
            'SOL',
            'Solitario',
            'Sabelotodo',
            'Senil',
            'Saul Goodman',
            'Spotify',
            'Suficiente',
            'Sobrado',
            'Sarpao',
            'Samurai'
          ]
        ],
        [
          't',
          [
            'Tatuado',
            'Teletón',
            'Tetona',
            'Taxista',
            'Tampoco',
            'Tesoro',
            'Trip',
            'Trap',
            'T-REX',
            'T_T',
            'Trechur (tesoro en inglés)',
            'Talón de aquiles',
            'Trepador',
            'Talismán',
            'Tiro al aire',
            'Tampax'
          ]
        ],
        ['u', ['Uniceja', 'Urbano', 'Unicelular', 'Ulpo', 'Umilde', 'uwu', 'Urologo', 'Uña', 'Ultra', 'Último']],
        [
          'v',
          [
            'Vago',
            'Vampiro',
            'Violento',
            'Value',
            'Volverás a mi',
            'Viajero',
            'Volátil',
            'Vagabundo',
            'Vueno',
            'Voh vela',
            'Vales oro',
            'Vomitivo',
            'Veras',
            'Vivaracho',
            'Vue'
          ]
        ],
        [
          'w',
          [
            'Wey',
            'Waka Waka',
            'www-data',
            'Weno',
            'Weon',
            'Wejejejeej',
            'whatsapp',
            'Watero',
            'Well done',
            'Walter',
            'Wakanda',
            'WakaWaka',
            'Weta'
          ]
        ],
        ['x', ['Xoro', 'Xuxa', 'Xixixi lelele', 'Xauxera', 'Xaleco', 'XMEN', 'XVIDEOS', 'Xilófono']],
        ['y', ['Yananaika', 'Yuka', 'Yuta', 'Yaero', 'YA', 'YO', 'Ya vas a ver', 'Yeta', 'Yoyo']],
        ['z', ['Zorrón', 'Zentaurus', 'Zulema', 'Zapato', 'Zolitario', 'Zabio', 'Zoldick', 'Zas!', 'Zebra', 'Zancudo']]
      ])

      const ref = input
        .toLowerCase()
        .replace('á', 'a')
        .replace('é', 'e')
        .replace('í', 'i')
        .replace('ó', 'o')
        .replace('ú', 'u')
        .replace('ú', 'u')
        .replace(' ', '~')
        .replace(/[0-9]+$/, '')
      const str = ref.split('').reduce((acc, letter) => {
        if (letters.has(letter)) {
          const word = rand(letters.get(letter))
          acc.push(word.replace(/(.{1})(.+)/, '*$1* _$2_'))
        } else {
          acc.push(`*${letter} *`)
        }
        return acc
      }, [])
      msg.send(`${str.join('\n')}`)
    }
  })
}
