// Description:
//   Cambia el texto a idioma Guru Guru
//   Basado en https://github.com/dokshor/guru_guru
//
// Dependencies:
//   none
//
// Configuration:
//   none
//
// Commands:
//   hubot guru <texto> - Traduce le texto al idioma guru guru
//
// Author:
//   @victorsanmartin

module.exports = function (robot) {
  robot.respond(/guru (.*)/i, function (msg) {
    var i, len, letter, letters, ref, str
    letters = {
      a: 'a',
      b: 'g',
      c: 'c',
      d: 'g',
      e: 'e',
      f: 'j',
      g: 'g',
      h: 'h',
      i: 'i',
      j: 'j',
      k: 'k',
      l: 'g',
      m: 'ñ',
      n: 'gn',
      ñ: 'ggni',
      o: 'o',
      p: 'c',
      q: 'q',
      r: 'cggg',
      s: 'j',
      t: 'c',
      u: 'u',
      v: 'g',
      w: 'w',
      x: 'kj',
      y: 'y',
      z: 'j'
    }

    str = []
    ref = msg.match[1].toLowerCase().split('')
    for (i = 0, len = ref.length; i < len; i++) {
      letter = ref[i]
      if (letters[letter] != null) {
        str.push(letters[letter])
      } else {
        str.push(letter)
      }
    }
    msg.send(str.join(''))
  })
}
