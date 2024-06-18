// Description:
//   Show BIN codes for Chilean banks
//
// Dependencies:
//   cheerio
//
// Configuration:
//   None
//
// Commands:
//   hubot bin help
//   hubot bin <bankname>
//
// Author:
//   @hectorpalmatellez

const cheerio = require('cheerio')

const baseUrl = 'https://www.freebinchecker.com/'

const bankList = {
  bice: {
    url: 'chile_banco-bice-bin-list-bank?hl=es'
  },
  bci: {
    url: 'chile_banco-credito-inversiones-bin-list-bank?hl=es'
  },
  itau: {
    url: 'chile_banco-itau-chile-bin-list-bank?hl=es'
  },
  security: {
    url: 'chile_banco-security-bin-list-bank?hl=es'
  },
  ripley: {
    url: 'chile_banco-ripley-bin-list-bank?hl=es'
  },
  falabella: {
    url: 'chile_banco-falabella-bin-list-bank?hl=es'
  },
  santander: {
    url: 'chile_banco-santander-chile-bin-list-bank?hl=es'
  },
  chile: {
    url: 'chile_banco-de-chile-bin-list-bank?hl=es'
  },
  scotiabank: {
    url: 'chile_scotiabank-chile-bin-list-bank?hl=es'
  }
}

module.exports = function (robot) {
  robot.respond(/bin(.*)/gi, (msg) => {
    const bankName = msg.message.text.split(' ')[2].toLowerCase()

    if (bankName === 'help') {
      const allBankNames = Object.keys(bankList)
      msg.send(`Tenemos ${allBankNames.length} bancos, la lista es: ${String(allBankNames).split(',').join(', ')}`)
      return
    }

    if (bankName && bankList[bankName]) {
      robot.http(baseUrl + bankList[bankName].url).get()((error, response, body) => {
        if (!error && response.statusCode === 200) {
          const $ = cheerio.load(body)
          const cardsContainer = $('#cont2 + .table-responsive.mt-4 table tbody tr')
          const cards = Array.from(cardsContainer).map(card => $(card).text().replace(/\n/g, ' ').trim())

          if (cards.length) {
            msg.send(`Encontramos *${cards.length}* 💳 para *${bankName}*:\n${cards.join(',').replace(/,/g, '\n').split()}`)
          } else {
            msg.send(`No encontramos tarjetas para *${bankName}*`)
          }
        } else {
          msg.send(':facepalm: Error: ', error)
        }
      })
    } else {
      msg.send('Banco 🏦 no encontrado. Deja de inventar o haz un PR.')
    }
  })
}
