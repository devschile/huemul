// Description:
//   Dice cuándo es el feriado mas próximo en Chile

// Dependencies:
//   none

// Configuration:
//   none

// Commands:
//   hubot proximo feriado - Retorna la cantidad de días, la fecha y el motivo del próximo feriado en Chile
//   hubot próximo feriado - Retorna la cantidad de días, la fecha y el motivo del próximo feriado en Chile

// Author:
//   @victorsanmartin

// Co-Author:
//   @jorgeepunan

const moment = require('moment')

function daysDiff (now, date) {
  var date1 = new Date(date + 'T00:00:00-04:00')
  var date2 = new Date(now + 'T00:00:00-04:00')
  var timeDiff = Math.abs(date2.getTime() - date1.getTime())
  var diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24))

  return diffDays
}

function humanizeMonth (month) {
  const monthNumber = month - 1
  const monthNames = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Sedtiembre',
    'Octubre',
    'Noviembre',
    'Diciembre'
  ]

  return monthNames[monthNumber]
}

function humanizeDay (day) {
  var dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

  return dayNames[day]
}

/**
 * @description Takes the list of holidays and a starting index to check
 * and finds the next non-weekend day
 */
const findNextWorkingDay = (holidays, startIndex) => {
  const FRIDAY_ISO_DAY = 5
  const nextHoliday = holidays[startIndex]
  if (!nextHoliday) {
    return null
  }
  const holiday = moment(`${nextHoliday.fecha}T00:00:00-04:00`)
  if (holiday.isoWeekday() > FRIDAY_ISO_DAY) {
    return findNextWorkingDay(holidays, startIndex + 1)
  } else {
    return nextHoliday
  }
}

const getOutputMessage = (holiday, dias, isWorkDay) => {
  var date = new Date(holiday.fecha + 'T00:00:00-04:00')
  const humanDate = holiday.fecha.split('-')
  const humanDay = humanDate[2].replace(/^0+/, '')
  const humanMonth = humanDate[1]
  const humanWeekDay = humanizeDay(date.getDay())
  const message = holiday.nombre + ' (_' + holiday.tipo.toLowerCase() + '_)'
  const plural = dias > 1 ? ['n', 's'] : ['', '']
  const mensajeInicial = isWorkDay ? 'El próximo feriado para los :gonzaleee: es el *' : 'El próximo feriado es el *'
  return (mensajeInicial +
    humanWeekDay +
    ' ' +
    humanDay +
    ' de ' +
    humanizeMonth(humanMonth) +
    '*, queda' +
    plural[0] +
    ' *' +
    dias +
    '* día' +
    plural[1] +
    '. Se celebra: ' +
    message +
    '.'
  )
}

module.exports = function (robot) {
  robot.respond(/pr(o|ó)ximo feriado/i, function (msg) {
    var today = new Date(
      [
        new Date().getFullYear(),
        ('0' + (new Date().getMonth() + 1)).slice(-2),
        ('0' + new Date().getDate()).slice(-2)
      ].join('-') + 'T00:00:00-04:00'
    )
    var currentYear = new Date().getFullYear()

    robot.http('https://apis.digital.gob.cl/fl/feriados/' + currentYear).get()(function (err, res, body) {
      if (err || res.statusCode !== 200) {
        return robot.emit('error', err || new Error(`Status code ${res.statusCode}`), msg, 'proximo-feriado')
      }
      var ok = false
      var bodyParsed = JSON.parse(body)

      bodyParsed.forEach(function (holiday, index) {
        var date = new Date(holiday.fecha + 'T00:00:00-04:00')
        var message = holiday.nombre + ' (_' + holiday.tipo.toLowerCase() + '_)'

        if (ok === false && date.getTime() >= today.getTime()) {
          ok = true

          const todayFormatted = [today.getFullYear(), ('0' + (today.getMonth() + 1)).slice(-2), ('0' + today.getDate()).slice(-2)].join('-')
          const remainingDays = daysDiff(todayFormatted, holiday.fecha)

          if (remainingDays === 0) {
            msg.send('*¡HOY es feriado!* Se celebra: ' + message + '. ¡Disfrútalo!')
          } else {
            const nextWeekDayHoliday = findNextWorkingDay(bodyParsed, index + 1)
            const outputMessage = getOutputMessage(holiday, remainingDays) + (nextWeekDayHoliday ? '\n' + getOutputMessage(nextWeekDayHoliday, daysDiff(todayFormatted, nextWeekDayHoliday.fecha), true) : '')
            msg.send(
              outputMessage
            )
          }
        }
      })
    })
  })
}
