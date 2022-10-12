//
// Dependencies:
//  None
//
// Configuration:
//   None
//
// Usage:
// var global420 = require('./helpers/global420');
// var info = global420.global420.next420();
//
// Author:
//   Camilo Castro - clsource © 2016
//
// Based on https://github.com/thedod/global420

var global420 = {}

var tz = require('./timezones')

var flickrplaces = require('./flickrplaces')

global420.getUTC = function () {
  var now = new Date()
  return now.getUTCHours() * 3600 + now.getUTCMinutes() * 60
}

global420.get420offset = function () {
  var offset = 16 * 3600 + 20 * 60 - global420.getUTC()

  if (offset < 0) {
    offset += 24 * 3600
  }

  return offset
}

global420.next420 = function () {
  var offs = global420.get420offset()

  for (var i = 0; i < tz.timezones.length; i++) {
    if (tz.timezones[i][0] <= offs) {
      return {
        minutes: (offs - tz.timezones[i][0]) / 60,
        places: tz.timezones[i][1]
      }
    }
  }
  return {
    minutes: 666,
    places: ["Snafu (Yes. It's a bug)"]
  }
}

global420.flickrplace = function (p) {
  return flickrplaces.flickrplaces[p] || '/' + escape(p)
}

exports.global420 = global420
