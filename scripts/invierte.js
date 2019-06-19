// Description:
//   Dado un string, invierte sus caracteres segun un mapa de unicode
//
// Dependencies:
//   None
//
// Configuration:
//   None
//
// Commands:
//   hubot invierte <string> - Invierte los caracteres de un string segun un mapa de unicode
//
// Author:
//   @jorgeepunan

function flipString(aString) {
  var last = aString.length - 1
  var result = new Array(aString.length)
  for (var i = last; i >= 0; --i) {
    var c = aString.charAt(i)
    var r = flipTable[c]
    result[last - i] = r !== undefined ? r : c
  }
  if (result !== '') {
    return result.join('')
  } else {
    return ':huemul: :gun:'
  }
}

var flipTable = {
  '\u0021': '\u00A1',
  '\u0022': '\u201E',
  '\u0026': '\u214B',
  '\u0027': '\u002C',
  '\u0028': '\u0029',
  '\u002E': '\u02D9',
  '\u0033': '\u0190',
  '\u0034': '\u152D',
  '\u0036': '\u0039',
  '\u0037': '\u2C62',
  '\u003B': '\u061B',
  '\u003C': '\u003E',
  '\u003F': '\u00BF',
  A: '\u2200',
  B: '\u10412',
  C: '\u2183',
  D: '\u25D6',
  E: '\u018E',
  F: '\u2132',
  G: '\u2141',
  J: '\u017F',
  K: '\u22CA',
  L: '\u2142',
  M: '\u0057',
  N: '\u1D0E',
  P: '\u0044',
  Q: '\u038C',
  R: '\u1D1A',
  T: '\u22A5',
  U: '\u2229',
  V: '\u1D27',
  Y: '\u2144',
  '\u005B': '\u005D',
  _: '\u203E',
  a: '\u0250',
  b: '\u0071',
  c: '\u0254',
  d: '\u0070',
  e: '\u01DD',
  f: '\u025F',
  g: '\u0183',
  h: '\u0265',
  i: '\u0131',
  j: '\u027E',
  k: '\u029E',
  l: '\u0283',
  m: '\u026F',
  n: '\u0075',
  r: '\u0279',
  t: '\u0287',
  v: '\u028C',
  w: '\u028D',
  y: '\u028E',
  '\u007B': '\u007D',
  '\u203F': '\u2040',
  '\u2045': '\u2046',
  '\u2234': '\u2235'
}

module.exports = function(robot) {
  robot.respond(/invierte (.*)/i, function(res) {
    var frase = res.match[1]

    msg = flipString(frase)
    res.send(msg)
  })
}
