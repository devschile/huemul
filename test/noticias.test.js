import 'coffee-script/register';
import test from 'ava';
import Helper from 'hubot-test-helper';

const helper = new Helper('../scripts/noticias.js');
const sleep = m => new Promise(resolve => setTimeout(() => resolve(), m));

test.beforeEach(t => {
  t.context.room = helper.createRoom({httpd: false});
});

test.afterEach(t => t.context.room.destroy());

test('Debe entregar alguna noticia relacionada con Game of Thrones', async t => {
  t.context.room.user.say('user', 'hubot noticias game of thrones');
  await sleep(5000);

  const user = t.context.room.messages[0];
  const hubot = t.context.room.messages[1];

  t.deepEqual(user, ['user', 'hubot noticias game of thrones']);
  t.is(hubot[0], 'hubot');
  t.true(/game of thrones/ig.test(hubot[1]));
});
