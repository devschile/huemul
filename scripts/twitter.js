// Description:
//   Obten un feed de Twitter pidiendose lo al :huemul:
//
// Dependencies:
//   twitter-rss-feed
//   fast-xml-parser
//
// Commands:
//   hubot twitter <usuario> - Obtiene el feed del usuario (los ultimos 5).
//
// Author:
//   @madkoding

const TwitterRSSFeed = require('twitter-rss-feed')
const parser = require('fast-xml-parser')
const _map = require('lodash/map')
const _get = require('lodash/get')
const tweetsMax = 4

module.exports = function (robot) {
  return robot.respond(/twitter (.*)/i, async (msg) => {
    const twitterUser = msg.match[1]

    const trf = new TwitterRSSFeed({
      consumer_key: process.env.HUBOT_TWITTER_CONSUMER_KEY,
      consumer_secret: process.env.HUBOT_TWITTER_CONSUMER_SECRET,
      token: process.env.HUBOT_TWITTER_ACCESS_TOKEN,
      token_secret: process.env.HUBOT_TWITTER_ACCESS_TOKEN_SECRET
    })

    // parameters for Twitter API (GET statuses/user_timeline)
    const params = {
      screen_name: twitterUser,
      count: tweetsMax,
      tweet_mode: 'extended'
    }

    // information of RSS feed
    const info = {
      channel: {
        title: `Feed de ${twitterUser}`,
        description: `Feed de ${twitterUser}`,
        link: `https://twitter.com/${twitterUser}`
      }
    }

    // create formatter function
    const tweetFormat = function (tweet) {
      const description = _get(tweet, 'full_text')
      const userName = _get(tweet, 'user.screen_name')
      const id = _get(tweet, 'id_str')
      return {
        title: description,
        link: `https://twitter.com/${userName}/status/${id}>`
      }
    }

    // set your formatter to opts.formatter
    const opts = {
      formatter: tweetFormat
    }

    let jsonObj = {}

    // create RSS feed
    const rss = await trf.statuses_user_timeline(params, info, opts)
    if (parser.validate(rss) === true) {
      jsonObj = parser.parse(rss)
    }

    const feeds = _map(_get(jsonObj, 'rss.channel.item', []), (feed) => {
      return {
        title: feed.title,
        value: `<${feed.link}|Leer mas...>`,
        short: true
      }
    })

    const attachment = {
      attachments: [
        {
          fallback: `Estos son los ultimos ${tweetsMax} tweets de ${twitterUser}`,
          color: '#00acee',
          text: `Estos son los ultimos ${tweetsMax} tweets de ${twitterUser}`,
          fields: feeds
        }
      ]
    }

    return msg.send(attachment)
  })
}
