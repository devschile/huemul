// Description:
//  Devuelve un proverbio chino aleatorio
//
// Dependencies:
// None
//
// Configuration:
//   CNPROVERB_GSHEET_API_KEY
//   CNPROVERB_GSHEET_ID
//
// Commands:
//  huemul proverbio - Trae un proverbio chino en inglés
//  huemul proverbio <zh|cn> - Trae un proverbio <en pinyín|en chino>
//
// Author:
//  @hectorpalmatellez

module.exports = (robot) => {
  robot.respond(/proverbio\s?(zh)?/, (message) => {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${process.env.CNPROVERB_GSHEET_ID}/values/Chinese_proverbs?alt=json&key=${process.env.CNPROVERB_GSHEET_API_KEY}`
    const language = {
      cn: 1,
      zh: 2,
      en: 3
    }
    const option = message.message.text.split(' ')[2]
    const languageIdentifier = option ? option.trim() : 'en'

    robot.http(url).get()((error, response, body) => {
      if (!error && response.statusCode === 200) {
        const data = JSON.parse(body)

        message.send(message.random(data.values)[language[languageIdentifier]])
      } else {
        message.send(':facepalm: Error: ', error)
      }
    })
  })
}
