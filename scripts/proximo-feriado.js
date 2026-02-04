
// Description:
//   Retorna cuándo es el feriado más próximo en Chile usando feriados.devschile.cl

// Dependencies:
//   moment

// Commands:
//   hubot proximo feriado - Retorna la fecha y motivo del próximo feriado en Chile
//   hubot próximo feriado - Retorna la fecha y motivo del próximo feriado en Chile

// Author:
//   @jorgeepunan

const moment = require('moment')

const nerdMessages = [
  'Está tan lejos que puedes terminar un sprint, refactorizar legacy y aún así no ver la luz del sol.',
  'Falta tanto que tu backlog va a crecer más rápido que tu motivación por vivir.',
  'Hay más chances de que te pidan deploy en viernes que de ver ese feriado pronto.',
  'Puedes aprender un nuevo framework, olvidarlo y aún así no llega el feriado.',
  'Falta tanto que hasta el código espagueti tiene tiempo de fermentar.',
  '¿Pensando en vacaciones? Mejor piensa en unit tests, el feriado no viene pronto.',
  'El próximo feriado está tan lejos que podrías terminar todos los tickets y aún así seguir esperando.'
]

function humanizeMonth (month) {
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ]
  return monthNames[parseInt(month, 10) - 1]
}

function humanizeDay (day) {
  const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
  return dayNames[day]
}

function sarcasticWeekendMessage (weekday) {
  if (weekday === 6) {
    return '¡Qué suerte! El próximo feriado es sábado. ¡A disfrutar tu día libre proletario, como si fuera diferente a cualquier otro sábado!'
  }
  if (weekday === 0) {
    return '¡Genial! El próximo feriado es domingo. El descanso del proletario, igual que todos los domingos, ¡no te emociones mucho!'
  }
  return null
}

function normalizeHolidays (feriadosData) {
  const feriadosPorMes = feriadosData.feriados || {}
  const feriados = Object.values(feriadosPorMes).reduce((acc, arr) => acc.concat(arr), [])
  return feriados.map(f => {
    const mes = String(f.mes).padStart(2, '0')
    const dia = String(f.dia).padStart(2, '0')
    return {
      ...f,
      date: `${feriadosData.year}-${mes}-${dia}`,
      title: f.descripcion
    }
  })
}

function buildNextHolidayMessage (feriadosData, today, randomFn = Math.random) {
  const feriadosConFecha = normalizeHolidays(feriadosData)
  const nextHoliday = feriadosConFecha.find(h => moment(h.date).isSameOrAfter(today, 'day'))
  if (!nextHoliday) {
    return 'No hay más feriados este año. ¡A trabajar, proletario!'
  }
  const holidayDate = moment(nextHoliday.date)
  const daysDiff = holidayDate.diff(today, 'days')
  const dayOfWeek = holidayDate.day()
  const humanDate = `${humanizeDay(dayOfWeek)} ${holidayDate.date()} de ${humanizeMonth(holidayDate.format('MM'))}`
  let message = `El próximo feriado es el *${humanDate}* (${nextHoliday.title}). Quedan *${daysDiff} día${daysDiff === 1 ? '' : 's'}*.`
  const sarcastic = sarcasticWeekendMessage(dayOfWeek)
  if (sarcastic) {
    message += `\n${sarcastic}`
  } else if (dayOfWeek >= 1 && dayOfWeek <= 5 && daysDiff > 14) {
    const randomMsg = nerdMessages[Math.floor(randomFn() * nerdMessages.length)]
    message += `\n${randomMsg}`
  }
  return message
}

module.exports = function (robot) {
  robot.respond(/pr(o|ó)ximo feriado/i, function (msg) {
    const today = moment()
    const currentYear = today.year()
    robot.http(`https://feriados.devschile.cl/api/holidays/${currentYear}`).get()(function (err, res, body) {
      if (err || res.statusCode !== 200) {
        return msg.send('No se pudo obtener la información de los feriados. Intenta más tarde.')
      }
      let feriadosData
      try {
        feriadosData = JSON.parse(body)
      } catch (e) {
        return msg.send('Error al procesar la información de los feriados.')
      }
      const message = buildNextHolidayMessage(feriadosData, today)
      msg.send(message)
    })
  })
}

module.exports._test = {
  humanizeMonth,
  humanizeDay,
  sarcasticWeekendMessage,
  normalizeHolidays,
  buildNextHolidayMessage,
  nerdMessages
}
