// Description:
//   Entrega una tarjeta de crédito autogenerada
//
// Dependencies:
//   cheerio
//
// Configuration:
//   None
//
// Commands:
//   hubot dame una visa|mastercard|american express|discover - Entrega una tarjeta de crédito autogenerada
//
// Author:
//   @victorsanmartin

const { load } = require('cheerio')

const fixExpireDate = date => {
  const [month, year] = date.split('/')
  const currentDate = new Date()
  const expireDate = new Date(year, month)
  const isDateExpired = currentDate > expireDate

  if (!isDateExpired) return date

  // When the credit card date is expire, fix it returning
  // the same month with a current year plus 1
  const fixedYear = currentDate.getFullYear() + 1
  return `${month}/${fixedYear}`
}

module.exports = robot => {
  robot.respond(/dame una (visa|mastercard|discover|american express)/i, msg => {
    const quequiere = msg.match[1].toLowerCase()
    let url

    if (quequiere === 'visa') {
      url = 'https://generatarjetasdecredito.com/generador-tarjetas-visa.php'
    } else if (quequiere === 'american express') {
      url = 'https://generatarjetasdecredito.com/generador-tarjetas-american-express.php'
    } else if (quequiere === 'discover') {
      url = 'https://generatarjetasdecredito.com/generador-tarjetas-discover.php'
    } else if (quequiere === 'mastercard') {
      url = 'https://generatarjetasdecredito.com/generador-tarjetas-mastercard.php'
    } else {
      return false
    }

    robot.http(url).get()((err, res, body) => {
      if (err) {
        robot.emit('error', err, msg, 'dameunatarjeta')
      } else {
        try {
          const dom = load(body)
          const creditCardNumberNode = dom('.venta')
          const creditCardNumber = creditCardNumberNode.text()
          const cvv = creditCardNumberNode.next().text().split(': ')[1]
          const expireDate = creditCardNumberNode.next().next().text().split(': ')[1]

          msg.send(`Nº: ${creditCardNumber}, CVV2/VCV2: ${cvv}, Vence: ${fixExpireDate(expireDate)}`)
        } catch (error) {
          robot.emit('error', error, msg, 'dameunatarjeta')
          msg.send('La API esta mala')
        }
      }
    })
  })
}
