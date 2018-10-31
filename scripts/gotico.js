// Description:
//   Cambia el texto a "Gótico"
//   Basado en https://github.com/dokshor/guru_guru
//
// Dependencies:
//   none
//
// Configuration:
//   none
//
// Commands:
//   hubot gotico <texto> - Escribe el texto en letra gótica
//
// Author:
//   @davidlaym

module.exports = function(robot) {
  robot.respond(/gotico (.*)/i, function(msg) {
    var i, len, letter, letters, ref, str
    letters = {
      a: '𝔞',
      b: '𝔟',
      c: '𝔠',
      d: '𝔡',
      e: '𝔢',
      f: '𝔣',
      g: '𝔤',
      h: '𝔥',
      i: '𝔦',
      j: '𝔧',
      k: '𝔨',
      l: '𝔩',
      m: '𝔪',
      n: '𝔫',
      o: '𝔬',
      p: '𝔭',
      q: '𝔮',
      r: '𝔯',
      s: '𝔰',
      t: '𝔱',
      u: '𝔲',
      v: '𝔳',
      w: '𝔴',
      x: '𝔵',
      y: '𝔶',
      z: '𝔷',
      A: '𝔄',
      B: '𝔅',
      C: 'ℭ',
      D: '𝔇',
      E: '𝔈',
      F: '𝔉',
      G: '𝔊',
      H: 'ℌ',
      I: 'ℑ',
      J: '𝔍',
      K: '𝔎',
      L: '𝔏',
      M: '𝔐',
      N: '𝔑',
      O: '𝔒',
      P: '𝔓',
      Q: '𝔔',
      R: 'ℜ',
      S: '𝔖',
      T: '𝔗',
      U: '𝔘',
      V: '𝔙',
      W: '𝔚',
      X: '𝔛',
      Y: '𝔜',
      Z: 'ℨ',
      '1': '𝟏',
      '2': '𝟐',
      '3': '𝟑',
      '4': '𝟒',
      '5': '𝟓',
      '6': '𝟔',
      '7': '𝟕',
      '8': '𝟖',
      '9': '𝟗',
      '0': '𝟎'
    }
    str = []
    ref = msg.match[1].substr(0, 140).split('')
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
