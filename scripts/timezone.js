// Description:
//   Cuanto falta
//
// Dependencies:
//   None
//
// Configuration:
//   None
//
// Commands:
//   hubot que hora - Indica la hora
//   hubot qué hora - Indica la hora
//   hubot la hora - Indica la hora
//
// Author:
//   @jorgeepunan

module.exports = robot => {
  robot.respond(/(.*)(qu[eé] hora|la hora.*)/i, msg => {
    // from DayTimr.js
    // https://github.com/juanbrujo/daytimr/blob/master/js/jquery.dayTimr-1.0.js

    let afternoonEndM, dawnEndM, morningEndM, nightEndM
    let nightStart = '19:00'
    let dawnStart = '1:00'
    let morningStart = '7:00'
    let afternoonStart = '13:00'
    const days = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
    const datetoday = new Date()
    const timenow = datetoday.getTime()
    datetoday.setTime(timenow)
    const theday = days[datetoday.getDay()]
    const thehour = datetoday.getHours()
    let theminute = datetoday.getMinutes()
    const thesecond = datetoday.getSeconds()
    nightStart = nightStart.split(':')
    const nightStartH = nightStart[0]
    const nightStartM = nightStart[1]
    dawnStart = dawnStart.split(':')
    const dawnStartH = dawnStart[0]
    const dawnStartM = dawnStart[1]
    morningStart = morningStart.split(':')
    const morningStartH = morningStart[0]
    const morningStartM = morningStart[1]
    afternoonStart = afternoonStart.split(':')
    const afternoonStartH = afternoonStart[0]
    const afternoonStartM = afternoonStart[1]
    let nightEndH = dawnStartH - 1
    const dawnEndH = morningStartH - 1
    const morningEndH = afternoonStartH - 1
    let afternoonEndH = nightStartH - 1

    if (nightStartH === 0) {
      afternoonEndH = 23
    }
    if (dawnStartH === 0) {
      nightEndH = 23
    }
    if ((nightStartM === '00') || (dawnStartM === '00') || (morningStartM === '00') || (afternoonStartM === '00')) {
      nightEndM = 59
      dawnEndM = 59
      morningEndM = 59
      afternoonEndM = 59
    }

    if (theminute < 10) {
      theminute = `0${theminute}`
    }

    // msg.send "Current Time: "+thehour+':'+theminute+':'+thesecond
    // msg.send "It's night from "+nightStartH+":"+nightStartM+" to "+nightEndH+":"+nightEndM
    // msg.send "It's dawn from "+dawnStartH+":"+dawnStartM+" to "+dawnEndH+":"+dawnEndM
    // msg.send "It's morning from "+morningStartH+":"+morningStartM+" to "+morningEndH+":"+morningEndM
    // msg.send "It's afternoon from "+afternoonStartH+":"+afternoonStartM+" to "+afternoonEndH+":"+afternoonEndM

    if (theday === 'sábado') {
      // NIGHT
      if ((thehour >= nightStartH) && (theminute >= nightStartM) && (thesecond <= 59) && (thehour <= nightEndH) && (theminute <= nightEndM) && (thesecond >= 0)) {
        msg.send(`Son las ${thehour}:${theminute}y es ${theday}. ¡Hora de parrandear!`)
      }

      // DAWN
      if ((thehour >= dawnStartH) && (theminute >= dawnStartM) && (thesecond <= 59) && (thehour <= dawnEndH) && (theminute <= dawnEndM) && (thesecond >= 0)) {
        msg.send(`Ya es ${theday} y de madrugada ${thehour}:${theminute}. Trata en volver a casa sano y salvo.`)
      }

      // MORNING
      if ((thehour >= morningStartH) && (theminute >= morningStartM) && (thesecond <= 59) && (thehour <= morningEndH) && (theminute <= morningEndM) && (thesecond >= 0)) {
        msg.send(`Son las ${thehour}:${theminute} del ${theday}, vuelve a dormir.`)
      }

      // TARDE
      if ((thehour >= afternoonStartH) && (theminute >= afternoonStartM) && (thesecond <= 59) && (thehour <= afternoonEndH) && (theminute <= afternoonEndM) && (thesecond >= 0)) {
        return msg.send(`Son las ${thehour}:${theminute} de un ${theday}, junta sed que ya se viene el carrete.`)
      }
    } else if (theday === 'domingo') {
      // NIGHT
      if ((thehour >= nightStartH) && (theminute >= nightStartM) && (thesecond <= 59) && (thehour <= nightEndH) && (theminute <= nightEndM) && (thesecond >= 0)) {
        msg.send(`Es ${theday(` y son las ${thehour}:${theminute}, a preparar la semana.`)}`)
      }

      // DAWN
      if ((thehour >= dawnStartH) && (theminute >= dawnStartM) && (thesecond <= 59) && (thehour <= dawnEndH) && (theminute <= dawnEndM) && (thesecond >= 0)) {
        msg.send(`Es ${theday} ${thehour}:${theminute} de madrugada. Vuelve a intentar dormir.`)
      }

      // MORNING
      if ((thehour >= morningStartH) && (theminute >= morningStartM) && (thesecond <= 59) && (thehour <= morningEndH) && (theminute <= morningEndM) && (thesecond >= 0)) {
        msg.send(`Son las ${thehour}:${theminute} del ${theday}, es mañana aún.`)
      }

      // TARDE
      if ((thehour >= afternoonStartH) && (theminute >= afternoonStartM) && (thesecond <= 59) && (thehour <= afternoonEndH) && (theminute <= afternoonEndM) && (thesecond >= 0)) {
        return msg.send(`Son las ${thehour}:${theminute} y es ${theday}, tómate una siesta.`)
      }
    } else {
      // NIGHT
      if ((thehour >= nightStartH) && (theminute >= nightStartM) && (thesecond <= 59) && (thehour <= nightEndH) && (theminute <= nightEndM) && (thesecond >= 0)) {
        msg.send(`Es hora de beber, ya son las ${thehour}:${theminute}de un ${theday}`)
      }

      // DAWN
      if ((thehour >= dawnStartH) && (theminute >= dawnStartM) && (thesecond <= 59) && (thehour <= dawnEndH) && (theminute <= dawnEndM) && (thesecond >= 0)) {
        msg.send(`Es madrugada del ${theday} y son las ${thehour}:${theminute}. Vuelve a intentar dormir.`)
      }

      // MORNING
      if ((thehour >= morningStartH) && (theminute >= morningStartM) && (thesecond <= 59) && (thehour <= morningEndH) && (theminute <= morningEndM) && (thesecond >= 0)) {
        msg.send(`Son las ${thehour}:${theminute} del ${theday}, es mañana aún.`)
      }

      // TARDE
      if ((thehour >= afternoonStartH) && (theminute >= afternoonStartM) && (thesecond <= 59) && (thehour <= afternoonEndH) && (theminute <= afternoonEndM) && (thesecond >= 0)) {
        msg.send(`Son las ${thehour}:${theminute} y es ${theday}, queda menos para salir del trabajo.`)
      }
    }
  })
}

// FIN
