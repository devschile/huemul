// Description:
//   TODO
//
// Dependencies:
//   moment-business-days
//
// Configuration:
//   None
//
// Commands:
//   hubot gardel
//
// Author:
//   @hectorpalmatellez

var moment = require('moment-business-days');

module.exports = function gardel(robot) {
  'use strict';

  moment.locale('es');


  robot.respond(/gardel|cu[aá]ndo pagan/, function(msg) {
    var today = moment();
    var lastBusinessDay = moment().endOf('month').isBusinessDay() ? moment().endOf('month') : moment().endOf('month').prevBusinessDay();
    var dayMessage = moment.duration(lastBusinessDay.diff(today)).humanize();
    var dayCount = lastBusinessDay.diff(today, 'days');
    var message = '';
    var plural = dayCount > 1 ? 'n' : '';
    if (dayCount === 0) {
      message = `:tada: Hoy pagan :tada:`;
    } else {
      message = `Falta${plural} ${dayMessage} para que paguen. Este mes pagan el ${lastBusinessDay.format('D')}, que cae ${lastBusinessDay.format('dddd')} :tired_face:`;
    }
    return msg.send(message);
  });
};
