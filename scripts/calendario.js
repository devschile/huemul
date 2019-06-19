// Description:
//   Despliega calendario del mes actual entre 1582 y 100 años hacia el futuro
//
// Dependencies:
//   None
//
// Configuration:
//   None
//
// Commands:
//   hubot calendario - Obtiene el calendario actual
//   hubot calendario <mes> - Obtiene el calendario del mes indicado para el año actual
//   hubot calendario <mes> <año> - Obtiene el calendario del mes y año indicados
//
// Author:
//   @jorgeepunan
//   @raerpo

const getDaysInMonth = (month, year) => new Date(year, month + 1, 0).getDate()

const weeksInMonth = (month, year) => {
  const offsetDays = new Date(year, month, 1).getDay()
  const spacesInCalendar = offsetDays + getDaysInMonth(month, year)
  return Math.ceil(spacesInCalendar / 7)
}

const formatCalendar = (calendarMatrix, header = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa']) => {
  const formatedHeader = '\n' + header.join(' ')
  return calendarMatrix.reduce((acc, current) => {
    const formatDays = current.map(day => {
      if (isNaN(day) || day === '  ') {
        return day
      } else {
        return day < 10 ? `0${day}` : `${day}`
      }
    })
    return acc + '\n' + formatDays.join(' ')
  }, formatedHeader)
}

const getCalendarMatrix = (
  month,
  year,
  header = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'],
  nonDaysSeparator = '  ',
  currentDateSymbol = '()'
) => {
  const firstDayOfWeek = new Date(year, month, 1).getDay()
  const daysInMonth = getDaysInMonth(month, year)
  const currentDate = new Date()
  const [currentDay, currentMonth, currentYear] = [
    currentDate.getDate(),
    currentDate.getMonth(),
    currentDate.getFullYear()
  ]
  const isCurrentMonthAndYear = currentMonth === month && currentYear === year
  // Build the calendar table
  let calendarMatrix = []
  let day = 1
  let firstDayIsSet = false
  for (let i = 0; i < weeksInMonth(month, year); i++) {
    for (let j = 0; j < header.length; j++) {
      // Create new row in calendar matrix
      if (!calendarMatrix[i]) {
        calendarMatrix[i] = []
      }
      // This logic only apply until the first day of the month is set
      // in the calendar matrix
      if (!firstDayIsSet) {
        if (j !== firstDayOfWeek) {
          calendarMatrix[i][j] = nonDaysSeparator
        } else {
          calendarMatrix[i][j] = isCurrentMonthAndYear && currentDay === day ? currentDateSymbol : day
          firstDayIsSet = true
          day++
        }
      } else {
        // Fill the rest of the calendar
        if (day <= daysInMonth) {
          calendarMatrix[i][j] = isCurrentMonthAndYear && currentDay === day ? currentDateSymbol : day
          day++
        } else {
          calendarMatrix[i][j] = nonDaysSeparator
        }
      }
    }
  }
  return calendarMatrix
}

const getCalendar = (month, year) => '```' + formatCalendar(getCalendarMatrix(month, year)) + '\n```'

const monthToNumber = month => {
  const months = [
    'enero',
    'febrero',
    'marzo',
    'abril',
    'mayo',
    'junio',
    'julio',
    'agosto',
    'septiembre',
    'octubre',
    'noviembre',
    'diciembre'
  ]
  return months.indexOf(month.toLowerCase())
}

const monthES = monthNum => {
  var months = [
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

  return months[monthNum]
}

const isInputValid = (month, year) => {
  // The condition could be written in a more nicer way but
  // I think the cases are more explicit in this way
  if (!month && !year) {
    return true
  }
  if (month && monthToNumber(month) < 0) {
    return false
  } else if (isNaN(new Date(year, 1, 1))) {
    return false
  }
  if (year < 1582 || year > new Date().getFullYear() + 100) {
    return false
  }
  return true
}

module.exports = function(robot) {
  robot.respond(/calendario(.*)/i, function(msg) {
    const [month, year] = msg.match[1].trim().split(' ')

    if (!isInputValid(month, year)) {
      msg.send('El mes o el año no son válidos')
      return
    }

    if (month && year) {
      const monthNumber = monthToNumber(month)
      if (monthNumber < 0) {
        msg.send('Ese mes no es válido')
      }
      msg.send(`\nCalendario para: ${monthES(monthNumber)} ${year}\n\r${getCalendar(monthNumber, year)}`)
    } else if (month) {
      const currentYear = new Date().getFullYear()
      const monthNumber = monthToNumber(month)
      if (monthNumber < 0) {
        msg.send('Ese mes no es válido')
      }
      msg.send(`\nCalendario para: ${monthES(monthNumber)} ${currentYear}\n\r${getCalendar(monthNumber, currentYear)}`)
    } else {
      const currentYear = new Date().getFullYear()
      const currentMonth = new Date().getMonth()
      msg.send(
        `\nCalendario para: ${monthES(currentMonth)} ${currentYear}\n\r${getCalendar(currentMonth, currentYear)}`
      )
    }
  })
}
