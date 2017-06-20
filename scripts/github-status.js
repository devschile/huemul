// Description:
//   Show current GitHub status and messages
//
// Dependencies:
//   None
//
// Configuration:
//   None
//
// Commands:
//   hubot github status - Returns the last human communication, status, and timestamp.
//   hubot github status resume - Returns the current system status and timestamp.
//   hubot github status all - Returns the most recent human communications with status and timestamp.
//
// Author:
//   voke
//
// Modified by:
//   @jorgeepunan

module.exports = robot => {
  // NOTE: messages contains new lines for some reason.
  let formatString = string => decodeURIComponent(string.replace(/(\n)/gm, ' '));

  robot.respond(/github status$/i, msg => {
    robot.http('https://status.github.com/api/last-message.json')
      .get()((err, res, body) => {
        if (err || res.statusCode !== 200) {
          return robot.emit('error', err || new Error(`Status code ${res.statusCode}`), msg)
        }
        let json = JSON.parse(body);
        let date = new Date(json['created_on']);
        msg.send(`:octocat: *[${json['status']}]* ${formatString(json['body'])} _(${date.toLocaleString()})_`);
    });
  });

  robot.respond(/github status resume$/i, msg => {
    robot.http('https://status.github.com/api/status.json')
      .get()((err, res, body) => {
        if (err || res.statusCode !== 200) {
          return robot.emit('error', err || new Error(`Status code ${res.statusCode}`), msg)
        }
        let json = JSON.parse(body);
        let now = new Date();
        let date = new Date(json['last_updated']);
        let secondsAgo = Math.round((now.getTime() - date.getTime()) / 1000);
        msg.send(`:octocat: Status: *${json['status']}* _(${secondsAgo} seconds ago)_`);
    });
  });

  robot.respond(/github status all$/i, msg => {
    robot.http('https://status.github.com/api/messages.json')
      .get()(function(err, res, body) {
        if (err || res.statusCode !== 200) {
          return robot.emit('error', err || new Error(`Status code ${res.statusCode}`), msg)
        }
        let json = JSON.parse(body);
        let buildMessage = message => {
          let date = new Date(message['created_on']);
          return `:octocat: *[${message['status']}]* ${formatString(message['body'])} _(${date.toLocaleString()})_`;
        };
        msg.send(Array.from(json).map(buildMessage).join('\n'));
    });
  });
};
