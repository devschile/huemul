// Description:
//   Devuelve el signo Chino dependiendo del año
//
// Configuration:
//   None
//
// Commands:
//   hubot signo chino <año> - Devuelve el signo Chino dependiendo del año seleccionado
//
// Author:
//   @raerpo

module.exports = robot => {
  robot.respond(/signo chino(.*)/i, function (msg) {
    const [, year] = msg.match

    if (year === undefined || year.trim() === '') {
      msg.send('Tienes que decirme de que año :retard:')
      return
    }
    const yearNumber = Number(year)
    if (isNaN(yearNumber) || yearNumber <= 0 || yearNumber > 3000) {
      msg.send('El año no es válido, intenta con otro.')
      return
    }
    const zodiacSign = getZodiacAnimal(year)
    msg.send(`El signo :flag-cn: de ${year.trim()} es ${zodiacSign.name}.\n ${zodiacSign.talisman}`)
  })
}

const getZodiacAnimal = year => {
  return zodiacData[String(year % 12)]
}

const zodiacData = {
  0: {
    name: 'el Mono',
    talisman: 'https://vignette.wikia.nocookie.net/jackiechanadventures/images/a/a4/Monkey_Talisman.png'
  },
  1: {
    name: 'el Gallo',
    talisman: 'https://vignette.wikia.nocookie.net/jackiechanadventures/images/2/25/Rooster_Talisman.png'
  },
  2: {
    name: 'el Perro',
    talisman: 'https://vignette.wikia.nocookie.net/jackiechanadventures/images/a/a4/Dog_Talisman.png'
  },
  3: {
    name: 'el Cerdo',
    talisman: 'https://vignette.wikia.nocookie.net/jackiechanadventures/images/5/54/Pig_Talisman.png'
  },
  4: {
    name: 'la Rata',
    talisman: 'https://vignette.wikia.nocookie.net/jackiechanadventures/images/d/d0/Rat_Talisman.png'
  },
  5: {
    name: 'el Buey',
    talisman: 'https://vignette.wikia.nocookie.net/jackiechanadventures/images/c/c7/Ox_Talisman.png'
  },
  6: {
    name: 'el Tigre',
    talisman: 'https://vignette.wikia.nocookie.net/jackiechanadventures/images/1/14/Tiger_Talisman.png'
  },
  7: {
    name: 'el Conejo',
    talisman: 'https://vignette.wikia.nocookie.net/jackiechanadventures/images/1/1b/Rabbit_Talisman.png'
  },
  8: {
    name: 'el Dragon',
    talisman: 'https://vignette.wikia.nocookie.net/jackiechanadventures/images/5/56/Dragon_Talisman.png'
  },
  9: {
    name: 'la Serpiente',
    talisman: 'https://vignette.wikia.nocookie.net/jackiechanadventures/images/e/ed/Snake_Talisman.png'
  },
  10: {
    name: 'el Caballo',
    talisman: 'https://vignette.wikia.nocookie.net/jackiechanadventures/images/f/ff/Horse_Talisman.png'
  },
  11: {
    name: 'la Oveja',
    talisman: 'https://vignette.wikia.nocookie.net/jackiechanadventures/images/d/db/Sheep_Talisman.png'
  }
}
