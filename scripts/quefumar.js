// Description:
//   Muestra un tipo de :mota: pa :smoking:
//
// Dependencies:
//   None
//
// Configuration:
//   None
//
// Command:
//   huemul que fumar <sativa|indica|hibrida>
//
// Author:
//   @jorgeepunan

const sativa = [
  'Sour Diesel',
  'Green Crack',
  'Jack Herer',
  'Durban Poison',
  'Lemon Haze',
  'Strawberry Cough',
  'Super Silver Haze',
  'Alaskan Thunder Fuck',
  'Amnesia Haze',
  'Maui Wowie',
  'Chocolope',
  'Harlequin'
]

const hibrida = [
  'Blue Dream',
  'GSC',
  'OG Crush',
  'GG4',
  'White Widow',
  'Pinneapple Express',
  'Trainwreck',
  'AK-47',
  'Headband',
  'Chemdawg',
  'Cherry Pie',
  'Blueberry OG',
  'Cheese',
  'Agent Orange',
  'Golden Goat'
]

const indica = [
  'Grandaddy Purple',
  'Bubba Kush',
  'Northern Lights',
  'Blue Cheese',
  'Purple Kush',
  'Blueberry',
  'Grape Ape',
  'Master Kush',
  'God\'s Gift',
  'Death Star',
  'Purple Urkle',
  'Afghan Kush',
  'Hindu Kush',
  'White Rino'
]

module.exports = robot => {
  robot.respond(/qu(e|é) fumar (\w+)/i, msg => {
    const type = msg.match[2].toLowerCase();
    switch(type) {
      case 'sativa':
        msg.send(`Sativa: puede ser *${msg.random(sativa)}* :slowparrot:`)
        break
      case 'indica':
        msg.send(`Indica: puede ser *${msg.random(indica)}* :perrosleep:`)
        break
      case 'hibrida':
        msg.send(`Híbrida: puede ser *${msg.random(hibrida)}* :mota:`)
        break
      default:
        msg.send('Debes escoger un tipo: sativa, indica o hibrida')
        break
    }
  })
}
