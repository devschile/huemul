// Description:
//   Search stack overflow and provide links to the first 5 questions
//
// Dependencies:
//   none
//
// Configuration:
//   None
//
// Commands:
//   hubot sosearch [me] <query> - Search for the query
//   hubot sosearch [me] <query> -tags <tag list separated by ,> - Search for the query limit to given tags
//
// Author:
//   @carsonmcdonald
//   @drdamour

const zlib = require('zlib')

// API keys are public for Stackapps
const hubotStackappsApikey = 'zprHb6)163sIQewYlxUQgw(('

module.exports = robot => {
  return robot.respond(/sosearch( me)? (.*)/i, function (msg) {
    const re = RegExp('(.*) -tags (.*)', 'i')
    const opts = msg.match[2].match(re)

    if (opts != null) {
      return soSearch(msg, opts[1], opts[2].split(','))
    } else {
      return soSearch(msg, msg.match[2], [])
    }
  })
}

var soSearch = function (msg, search, tags) {
  let data = ''
  return msg.http('https://api.stackexchange.com/2.2/search')
    .query({
      site: 'stackoverflow',
      intitle: search,
      key: hubotStackappsApikey,
      tagged: tags.join(';'),
      filter: '!9YdnSQVoS', // add total to response,
      sort: 'relevance'
    }).get((err, req) => {
      if (err) console.log(err)
      req.addListener('response', function (res) {
        let output = res

        // pattern stolen from http://stackoverflow.com/questions/10207762/how-to-use-request-or-http-module-to-read-gzip-page-into-a-string
        if (res.headers['content-encoding'] === 'gzip') {
          output = zlib.createGunzip()
          res.pipe(output)
        }

        output.on('data', d => { data += d.toString('utf-8') })

        return output.on('end', function () {
          const parsedData = JSON.parse(data)
          if (parsedData.error) {
            msg.send(`Error searching stack overflow: ${parsedData.error.message}`)
            return
          }

          if (parsedData.total > 0) {
            const qs = Array.from(parsedData.items.slice(0, 6)).map((question) =>
              `http://www.stackoverflow.com/questions/${question.question_id} - ${question.title}`)
            if ((parsedData.total - 5) > 0) {
              qs.push(`${parsedData.total - 5} more...`)
            }
            return Array.from(qs).map((ans) =>
              msg.send(ans))
          } else {
            return msg.reply('No questions found matching that search.')
          }
        })
      })
    }
    )()
}
