// Description:
//   Despliega calendario del mes actual
//
// Dependencies:
//   None
//
// Configuration:
//   None
//
// Commands:
//   hubot calendario
//
// Author:
//   @jorgeepunan

function displayCalendar(today, month, year) {
  month = parseInt(month)
  year = parseInt(year)
  var i = 0
  var days = getDaysInMonth(month + 1, year)
  var firstOfMonth = new Date(year, month, 1)
  var startingPos = firstOfMonth.getDay()
  days += startingPos
  var calendar = ' Do Lu Ma Mi Ju Vi Sa'
  calendar += '\n --------------------'
  for (i = 0; i < startingPos; i++) {
    if (i % 7 == 0) calendar += '\n '
    calendar += '   '
  }
  for (i = startingPos; i < days; i++) {
    if (i % 7 == 0) calendar += '\n '
    if (i - startingPos + 1 < 10) calendar += '0'
    if (i - startingPos + 1 == today) {
      calendar += '()'
    } else {
      calendar += i - startingPos + 1
    }
    calendar += ' '
  }
  for (i = days; i < 42; i++) {
    if (i % 7 == 0) calendar += '\n '
    calendar += '   '
  }

  return calendar
}

function getDaysInMonth(month, year) {
  var days

  if (month == 1 || month == 3 || month == 5 || month == 7 || month == 8 || month == 10 || month == 12) days = 31
  else if (month == 4 || month == 6 || month == 9 || month == 11) days = 30
  else if (month == 2) {
    if (isLeapYear(year)) {
      days = 29
    } else {
      days = 28
    }
  }

  return days
}

function isLeapYear(Year) {
  if ((Year % 4 == 0 && Year % 100 != 0) || Year % 400 == 0) {
    return true
  } else {
    return false
  }
}

function monthES(monthNum) {
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

module.exports = function(robot) {
  robot.respond(/calendario/i, function(msg) {
    var date = new Date()
    var today = date.getDate()
    var currentMonth = date.getMonth()
    var currentYear = date.getFullYear()

    msg.send(
      '```\n Calendario para: ' +
        monthES(currentMonth) +
        '/' +
        currentYear +
        '\n\n' +
        displayCalendar(today, currentMonth, currentYear) +
        '\n```'
    )
  })
}
