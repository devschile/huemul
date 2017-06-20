// Description:
//  Noticias desde 24horas
//
// Dependencies:
//  moment
//
// Commands:
//  hubot noticias internacional
//  hubot noticias nacional
//  hubot noticias de perros
//
// Author:
//  @jlobitu

const moment = require('moment');

module.exports = robot => robot.respond(/noticias (.*)/i, msg => {
  const q = msg.match[1];
  const fetch = robot.http(`http://search.24horas.cl/search/?q=${q}`);

  fetch.get()((err, res, body) => {
    if (err) {
      robot.emit('error', err, msg);
    } else {
      const {matches} = JSON.parse(body);

      // Filtrar noticias encontradas para eliminar repeticiones a partir del título.
      const matchesUniq = matches.filter((n, index, self) => {
        const {value: title} = n.fields.find(({field}) => field === 'og-title');
        return (
          self.findIndex(
            ({fields}) =>
              fields.find(({field}) => field === 'og-title').value === title
          ) === index
        );
      });

      // Truncate array
      (matchesUniq.length > 5) && (matchesUniq.length = 5);

      const head = ':huemul: *News*';
      const news = matchesUniq.map(({fields}, i) => {
        const {value: date} = fields.find(({field}) => field === 'publishtime');
        const {value: title} = fields.find(({field}) => field === 'og-title');
        const {value: url} = fields.find(({field}) => field === 'og-url');

        return `${i + 1}: <${url}|${title}> (${moment(date).fromNow()})`;
      }).join('\n');

      if (news) {
        msg.send(`${head}\n${news}\n<http://www.24horas.cl/search/|Sigue buscando en 24horas.cl>`);
      } else {
        msg.send(`${head}\nNo se han encontrado noticias sobre *${q}*.`);
      }
    }
  });
});
