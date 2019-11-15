// Description:
//   Cambia el texto a idioma Thicc
//   Basado en el script de @victorsanmartin que está basado en https://github.com/dokshor/guru_guru
//
// Dependencies:
//   none
//
// Configuration:
//   none
//
// Commands:
//   hubot thicc <texto> - Traduce el texto al idioma thicc
//
// Author:
//   @hectorpalmatellez

module.exports = function (robot) {
  robot.respond(/thicc (.*)/i, function (msg) {
    var i, len, letter, letters, ref, str
    letters = {
      a: '卂',
      b: '乃',
      c: '匚',
      d: '刀',
      e: '乇',
      f: '下',
      g: '厶',
      h: '卄',
      i: '工',
      j: '丁',
      k: '长',
      l: '乚',
      m: '从',
      n: '𠘨',
      ñ: '𠘨',
      o: '口',
      p: '尸',
      q: '㔿',
      r: '尺',
      s: '丂',
      t: '丅',
      u: '凵',
      v: 'リ',
      w: '山',
      x: '乂',
      y: '丫',
      z: '乙'
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
