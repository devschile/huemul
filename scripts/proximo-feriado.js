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
//   @raerpo

const moment = require('moment')

// Constants
const SATURDAY_ISO_DAY = 6
const SUNDAY_ISO_DAY = 7

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
  const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

  return dayNames[day]
}

const getOutputMessage = (holiday, days, { isWorkDay = true }) => {
  if (holiday === undefined) {
    return
  }
  const date = new Date(`${holiday.fecha}T00:00:00-04:00`)
  const humanDate = holiday.fecha.split('-')
  const humanDay = humanDate[2].replace(/^0+/, '')
  const humanMonth = humanDate[1]
  const humanWeekDay = humanizeDay(date.getDay())
  const message = `${holiday.nombre} (_${holiday.tipo.toLowerCase()}_)`
  const plural = days > 1 ? ['n', 's'] : ['', '']
  const mensajeInicial = isWorkDay ? 'El próximo feriado es el' : 'El próximo feriado para los :gonzaleee: es el'
  return `${mensajeInicial} *${humanWeekDay} ${humanDay} de ${humanizeMonth(humanMonth)}*, queda${
    plural[0]
  } *${days} día${plural[1]}*. Se celebra: *${message}*`
}

const getNextWorkingHoliday = (holidays, refDate) => {
  if (holidays.length === 0) {
    return null
  }
  const futureHolidays = holidays.filter(holiday => moment(`${holiday.fecha}T00:00:00-04:00`).isAfter(moment(refDate)))
  if (futureHolidays[0].isWorkDay) {
    return futureHolidays[0]
  } else {
    // eslint-disable-next-line no-unused-vars
    const [_, ...nextHolidays] = futureHolidays
    return getNextWorkingHoliday(nextHolidays, refDate)
  }
}

exports.getNextWorkingHoliday = getNextWorkingHoliday

module.exports = function (robot) {
  robot.respond(/pr(o|ó)ximo feriado/i, function (msg) {
    const today = new Date(
      [
        new Date().getFullYear(),
        ('0' + (new Date().getMonth() + 1)).slice(-2),
        ('0' + new Date().getDate()).slice(-2)
      ].join('-') + 'T00:00:00-04:00'
    )
    const currentYear = new Date().getFullYear()

    robot.http(`https://apis.digital.gob.cl/fl/feriados/${currentYear}`).get()(function (err, res, body) {
      if (err || res.statusCode !== 200) {
        return robot.emit('error', err || new Error(`Status code ${res.statusCode}`), msg, 'proximo-feriado')
      }

      const bodyParsed = JSON.parse(body)

      // Filter out data from past days
      const nextHolidays = bodyParsed.filter(holiday => {
        const date = new Date(`${holiday.fecha}T00:00:00-04:00`)
        return moment(date).isSame(today) || moment(date).isAfter(today)
      })

      // No more holidays for this year :depressed:
      if (nextHolidays.length === 0) {
        msg.send('No hay más feriados este año :depressed:')
      } else if (nextHolidays.length > 0) {
        /**
         * extend the holidays data with the property if it's a working day. I couldn't find a better name
         * so I leave a comment instead
         */
        const extendedHolidays = nextHolidays.map(holiday => {
          const date = moment(`${holiday.fecha}T00:00:00-04:00`)
          const isWorkingDay = date.isoWeekday() !== SATURDAY_ISO_DAY && date.isoWeekday() !== SUNDAY_ISO_DAY
          return { ...holiday, isWorkingDay }
        })
        /**
         * print the next holiday and in case of being a non-working day show the next one
         */
        for (let i = 0; i <= extendedHolidays.length; i++) {
          const holiday = extendedHolidays[i]
          const date = moment(`${holiday.fecha}T00:00:00-04:00`)
          const message = `${holiday.nombre} (_${holiday.tipo.toLowerCase()}_)`
          if (moment(date).isSame(today)) {
            msg.send(`*¡HOY es feriado!* Se celebra: *${message}*. ¡Disfrútalo!`)
          } else if (moment(date).isAfter(today)) {
            if (holiday.isWorkDay) {
              msg.send(getOutputMessage(holiday, date.diff(today, 'days'), { isWorkDay: true }))
            } else {
              msg.send(getOutputMessage(holiday, date.diff(today, 'days'), { isWorkDay: true }))
              const nextHoliday = getNextWorkingHoliday(extendedHolidays, holiday.fecha)
              if (nextHoliday) {
                msg.send(
                  getOutputMessage(nextHoliday, moment(nextHoliday.fecha).diff(today, 'days'), { isWorkDay: false })
                )
              }
            }
            break
          }
        }
      }
    })
  })
}
