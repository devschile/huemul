// Description:
//  Random Item Helper
//
// Dependencies:
//  None
//
// Configuration:
//   None
//
// Usage:
// var random = require('./helpers/random');
// var item = random.item(items);
//
// Author:
//   @jorgeepunan © 2015
//   @clsource © 2016

// Picks a random item from an array
exports.item = function (items) {
  return items[~~(Math.random() * items.length)]
}
