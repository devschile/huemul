// Description:
//   Cambia el texto a vaporwave
//   Basado en https://github.com/dokshor/guru_guru
//
// Dependencies:
//   none
//
// Configuration:
//   none
//
// Commands:
//   hubot vapor <texto> - Traduce le texto al vaporwave
//
// Author:
//   @alvaroveliz

module.exports = function(robot) {
  robot.respond(/vapor (.*)/i, function(msg) {
    var i, len, letter, letters, ref, str;
    letters = {
      "1": "１",
      "2": "２",
      "3": "３",
      "4": "４",
      "5": "５",
      "6": "６",
      "7": "７",
      "8": "８",
      "9": "９",
      "0": "０",
      ":": "：",
      ";": "；",
      "=": "＝",
      "?": "？",
      "*": "＊",
      "+": "＋",
      "a": "ａ",
      "b": "ｂ",
      "c": "ｃ",
      "d": "ｄ",
      "e": "ｅ",
      "f": "ｆ",
      "g": "ｇ",
      "h": "ｈ",
      "i": "ｉ",
      "j": "ｊ",
      "k": "ｋ",
      "l": "ｌ",
      "m": "ｍ",
      "n": "ｎ",
      "ñ": "～",
      "o": "ｏ",
      "p": "ｐ",
      "q": "ｑ",
      "r": "ｒ",
      "s": "ｓ",
      "t": "ｔ",
      "u": "ｕ",
      "v": "ｖ",
      "w": "ｗ",
      "x": "ｘ",
      "y": "ｙ",
      "z": "ｚ",
      " ": "･",
      ".": "｡",
      "{": "ﾈ",
      "}": "ﾁ",
      "(": "ｱ",
      ")": "ｶ",
      "-": "ｵ",
      "_": "ﾒ"
    };

    str = [];
    ref = msg.match[1].toLowerCase().split("");
    for (i = 0, len = ref.length; i < len; i++) {
      letter = ref[i];
      if (letters[letter] != null) {
        str.push(letters[letter]);
      } else {
        str.push(letter);
      }
    }
    msg.send(str.join(""));
  });
};