// Description:
//   Dice cuándo es el feriado mas próximo en Chile

// Dependencies:
//   none

// Configuration:
//   none

// Commands:
//   hubot pr(o|ó)ximo feriado - Retorna la cantidad de días, la fecha y el motivo del próximo feriado en Chile

// Author:
//   @victorsanmartin

// Co-Author:
//   @jorgeepunan


function days_diff(now, date) {
  var date1 = new Date(date + 'T00:00:00-03:00'),
      date2 = new Date(now + 'T00:00:00-03:00'),
      timeDiff = Math.abs(date2.getTime() - date1.getTime()),
      diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));

  return diffDays;
}


function humanizeMonth(month){
  var month       = month - 1,
      monthNames  = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Sedtiembre','Octubre','Noviembre','Diciembre'];

  return monthNames[month];
}

function humanizeDay(day){
  var dayNames  = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  return dayNames[day];
}


module.exports = function (robot) {

  robot.respond(/pr(o|ó)ximo feriado/i, function (msg) {

    var today = new Date([
          new Date().getFullYear(),
          ('0' + (new Date().getMonth() + 1)).slice(-2),
          ('0' + (new Date().getDate())).slice(-2)
        ].join('-') + 'T00:00:00-03:00');
    msg
      .http("https://raw.githubusercontent.com/quest/feriadosapp/master/holidays.json")
      .get()(function(err, res, body){
          var ok = false,
              body = JSON.parse(body);

          body.data.forEach(function(holiday, index) {
            var date          = new Date(holiday.date + 'T00:00:00-03:00'),
                humanDate     = holiday.date.split('-');
                humanDay      = humanDate[2].replace(/^0+/, '');
                humanMonth    = humanDate[1],
                humanWeekDay  = humanizeDay(date.getDay()),
                message       = holiday.title + " (_" + holiday.extra.toLowerCase() + "_)";

            if (ok == false && date.getTime() >= today.getTime()) {
              ok = true;

              var dias = days_diff([
                today.getFullYear(),
                ('0' + (today.getMonth() + 1)).slice(-2),
                ('0' + (today.getDate())).slice(-2)
              ].join('-'), holiday.date);

              if (dias == 0) {
                msg.send('¡*HOY* es feriado! Se celebra: ' + message + '. ¡Disfrútalo!');
              } else {
                msg.send("El próximo feriado es el *" + humanWeekDay + " " + humanDay + " de " + humanizeMonth(humanMonth) + "*, quedan *" + dias + "* días. Se celebra: " + message + ".");
              }
            }
          });

      });

  });

}
