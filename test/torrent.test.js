import 'coffee-script/register'
import test from 'ava'
import Helper from 'hubot-test-helper'
import nock from 'nock'

const helper = new Helper('../scripts/torrent.js')
const sleep = m => new Promise(resolve => setTimeout(() => resolve(), m))

test.beforeEach(t => {
  t.context.room = helper.createRoom({ httpd: false })
})

test.afterEach(t => t.context.room.destroy())

test('Torrent de Titanic', async t => {
  nock('https://yts.mx')
    .get('/api/v2/list_movies.json')
    .query({ limit: 5, query_term: 'titanic' })
    .reply(200, {
      data: {
        movie_count: 20,
        movies: [
          { url: 'https://yts.mx/movies/titanic-25-years-later-with-james-cameron-2023', title: 'Titanic: 25 Years Later with James Cameron', year: 2023, rating: 6.5 },
          { url: 'https://yts.mx/movies/titanic-waltz-1965', title: 'Titanic Waltz', year: 1965, rating: 8.6 },
          { url: 'https://yts.mx/movies/the-blind-man-who-did-not-want-to-see-titanic-2021', title: 'The Blind Man Who Did Not Want to See Titanic', year: 2021, rating: 7.5 },
          { url: 'https://yts.mx/movies/titanic-666-2022', title: 'Titanic 666', year: 2022, rating: 3.2 },
          { url: 'https://yts.mx/movies/the-chambermaid-on-the-titanic-1997', title: 'The Chambermaid on the Titanic', year: 1997, rating: 6.6 }
        ]
      }
    })
  t.context.room.user.say('user', 'hubot torrent titanic')
  await sleep(500)

  const user = t.context.room.messages[0]
  const hubotMessage1 = t.context.room.messages[1]
  const hubotMessage2 = t.context.room.messages[2]

  // test message of user
  t.deepEqual(user, ['user', 'hubot torrent titanic'])

  // test response messages of hubot
  t.deepEqual(hubotMessage1, ['hubot', 'Esperando respuesta de YTS YIFY... :loading:'])
  const text = `Encontradas 20 coincidencias:
<https://yts.mx/movies/titanic-25-years-later-with-james-cameron-2023|Titanic: 25 Years Later with James Cameron: año: 2023, rating: 6.5>
<https://yts.mx/movies/titanic-waltz-1965|Titanic Waltz: año: 1965, rating: 8.6>
<https://yts.mx/movies/the-blind-man-who-did-not-want-to-see-titanic-2021|The Blind Man Who Did Not Want to See Titanic: año: 2021, rating: 7.5>
<https://yts.mx/movies/titanic-666-2022|Titanic 666: año: 2022, rating: 3.2>
<https://yts.mx/movies/the-chambermaid-on-the-titanic-1997|The Chambermaid on the Titanic: año: 1997, rating: 6.6>
Todos los resultados en *<https://yts.ag/browse-movies/titanic|yts.arg>*`
  t.deepEqual(hubotMessage2, ['hubot', text])
})
