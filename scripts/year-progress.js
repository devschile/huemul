// Description:
//   Muestra en una barra de progreso con cuanto ha pasado del año
//
// Dependencies:
//   None
//
// Configuration:
//   None
//
// Commands:
//   hubot year progress - Muestra en una barra de progreso con cuanto ha pasado del año
//
// Author:
//   @alv.alvarez

// Function for generating the amazing progress bar
// * Author Victor Nizeyimanaa
// https://github.com/MrDatastorage/Year-Progress-Twitter-Bot/blob/master/bot.js

function repeat(s, i) {
  let r = ''
  for (let j = 0; j < i; j += 1) r += s
  return r
}

function makeBar(perc, barStyle = '░█') {
  let p = perc
  let d
  let full
  let m
  let middle
  let r
  let rest
  let x
  let minDelta = Number.POSITIVE_INFINITY
  const fullSymbol = barStyle[barStyle.length - 1]
  const n = barStyle.length - 1
  if (p === 100) return repeat(fullSymbol, 10)
  p /= 100

  for (let i = 25; i >= 1; i -= 1) {
    x = p * i
    full = Math.floor(x)
    rest = x - full
    middle = Math.floor(rest * n)
    if (p !== 0 && full === 0 && middle === 0) middle = 1
    d = Math.abs(p - (full + middle / n) / i) * 100
    if (d < minDelta) {
      minDelta = d
      m = barStyle[middle]
      if (full === i) m = ''
      r = `${repeat(fullSymbol, full)} ${m} ${repeat(barStyle[0], i - full - 1)}`
    }

    return r
  }
}

module.exports = robot => {
  robot.respond(/(year progress|c(o|ó)mo vamos)/i, msg => {
    const now = new Date()
    const thisYear = now.getFullYear()
    const nextYear = now.getFullYear() + 1
    const start = new Date(now.getFullYear(), 0, 0) // Start of this year
    const end = new Date(now.getFullYear() + 1, 0, 0) // End of this year
    const progressYearPercentage = (now - start) / (end - start) * 100
    const formatPercentage = Number(progressYearPercentage.toFixed(2))
    msg.send(`${thisYear} (${formatPercentage}%) ${makeBar(formatPercentage)} ${nextYear}`)
  })
}
