// Description:
//  In-memory polls. Inspired by SimplePoll & votador.js  by @juanbrujo & @antonishen
// Dependencies:
//  None
// Usage:
//  huemul poll start "option1" "option2"
// Options:
//  limit: (1-100 | -1 = unlimited) Voting limit per user. Default: 1
//  expiresIn: (Number) Amount of time the poll with last. Defaults to 30 minutes. 
// Author:
//  Dilip Ramirez <@dukuo> <dilip.ramirez@gmail.com>

const { block, element, object, TEXT_FORMAT_MRKDWN, TEXT_FORMAT_PLAIN } = require('slack-block-kit')
const { WebClient } = require('@slack/web-api')
const cron = require('node-cron')

const token = process.env.HUBOT_SLACK_TOKEN
const web = new WebClient(token)

const { text, } = object
const {
    button,
} = element
const { section, actions, divider, context, image } = block

//https://gist.github.com/jed/982883
const uuid = function b(a) { return a ? (a ^ Math.random() * 16 >> a / 4).toString(16) : ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, b) }

module.exports = bot => {
    const debug = true

    // Used as the main bot command
    const POLL_KEYWORD = 'poll'

    const POLL_MIN_OPTIONS = 2

    // Events
    const ON_POLL_CHOICE = 'poll_choice'
    const ON_REMOVE_POLL = 'remove_poll'
    const ON_FINISH_POLL = 'finish_poll'

    // Text labels
    const TXT_VOTE_BUTTON = 'Votar'
    const TXT_POLL_BY = 'Encuesta por'
    const TXT_FINISH_POLL_BUTTON = 'Finalizar'
    const TXT_REMOVE_POLL_BUTTON = 'Eliminar'
    const TXT_CREATING_POLL_STATUS_MESSAGE = `*Creating poll*. If you see this message for more than 2 seconds something might have gone wrong. Please stand by...`
    const TXT_FINISH_POLL_STANDBY = '*Poll:* Fetching poll results. If you see this message for more than 2 seconds something might have gone wrong. Please stand by... '
    const TXT_POLL_MIN_OPTIONS = `*New poll*: You must have at least ${POLL_MIN_OPTIONS} options to create a new poll.`
    const TXT_TITLE_SEPARATOR = '\\n'
    const TXT_VOTER_PLURAL = 'Voters'
    const TXT_VOTER_NONE = 'No votes'
    const TXT_VOTER_SINGULAR = 'Voter'

    // Clean scheduler cron settings
    const cleaningCronSettings = "0 * * * *" // every 1 hour https://crontab.guru/every-1-hour
    let cleaningCron = null

    const optionShape = {
        block: {},
        voters: []
    }
    const pollBlockShape = {
        author: null,
        title: '',
        limit: 1,
        options: [],
    }

    const managedPollShape = {
        active: false,
        channel: '',
        expiresIn: 5 * 60 * 1e3, // 30 minutes
        begin: null,
        block: {},
        metadata: {}
    }

    const pollManager = {
        scheduled: [],
        polls: {},
    }


    const parseTitleAndSubtitle = commands => commands.map(cmd => {
        const split = cmd.split(TXT_TITLE_SEPARATOR)
        return {
            title: split[0],
            subtitle: split[1] ? split[1] : undefined
        }
    })

    const buildPollOptions = (data) => {
        const options = []
        data.forEach(({ title, subtitle }) => {
            const id = uuid()
            const block = buildOptionBlock({
                title,
                subtitle,
                value: id
            })

            options.push({
                ...optionShape,
                value: id,
                title,
                block
            })
        })
        return options
    }

    const getOptionFromPoll = (pollId, optId) => {
        const poll = getPoll(pollId)
        if (poll) {
            return poll.options[optId]
        } else {
            return undefined
        }
    }

    const buildOptionContext = (pollId = undefined, optId = undefined) => {
        const option = pollId ? getOptionFromPoll(pollId, optId) : optionShape
        const voters = option.voters
        const votersCount = voters.length

        const votersBlock = voters.map(voter => buildVoterBlock(voter))
        const votersText = votersCount > 1 ? TXT_VOTER_PLURAL : votersCount < 1 ? TXT_VOTER_NONE : TXT_VOTER_SINGULAR
        const votersCountBlock =
            text(`${votersCount > 0 ? `${votersCount} ` : ''}${votersText}`,
                votersCount > 0 ? TEXT_FORMAT_PLAIN : TEXT_FORMAT_MRKDWN,
                { emoji: votersCount > 0 ? true : false }
            )

        votersBlock.push(votersCountBlock)

        return context(votersBlock)
    }

    const buildVoterBlock = voter => image(voter.avatar, voter.name)

    const buildPollBlock = (channel, data) => {
        const {
            title,
            author: {
                name,
            },
            options,
            limit,
            expiresIn
        } = {
            ...pollBlockShape,
            ...data
        }
        
        console.log(data.author.slack.profile)
        debug && console.log(data)

        const pollId = uuid()
        const header = section(
            text(`*${title}* ${TXT_POLL_BY} @${name}`, TEXT_FORMAT_MRKDWN)
        )
        const _divider = divider()
        const pollActions = buildPollActions(pollId)

        const extractOptionBlocks = options.map(opt => opt.block)

        const pollBlockData = [
            header,
            _divider,
        ]
        extractOptionBlocks.forEach(optBlock => pollBlockData.push(...optBlock))

        pollBlockData.push(_divider)
        pollBlockData.push(pollActions)

        pushPoll(pollId, {
            ...managedPollShape,
            block: pollBlockData,
            data: {
                title,
                author: name,
            },
            options,
            limit,
            expiresIn
        })

        return {
            id: pollId,
            block: pollBlockData
        }
    }

    const buildPollActions = (pollId) => {
        const endPollBtn = buildButtonBlock(ON_FINISH_POLL, TXT_FINISH_POLL_BUTTON, pollId)
        const removePollBtn = buildButtonBlock(ON_REMOVE_POLL, TXT_REMOVE_POLL_BUTTON, pollId)
        return actions(
            [
                endPollBtn,
                removePollBtn
            ], {
            blockId: `pollActions-${pollId}`
        }
        )
    }

    const buildButtonBlock = (actionId, text, value) => {
        return button(actionId, text, {
            value,
        })
    }

    const buildOptionBlock = (option, optionId = undefined, pollId = undefined) => {
        const { title, subtitle = null, value } = option

        const newButton = buildButtonBlock(ON_POLL_CHOICE, TXT_VOTE_BUTTON, value)
        const votersBlock = buildOptionContext(pollId, optionId)
        return [
            section(
                text(`*${title}*${subtitle !== null ? `\n${subtitle}` : ''}`, TEXT_FORMAT_MRKDWN),
                {
                    accessory: newButton
                }
            ),
            votersBlock
        ]
    }

    // Poll management

    const startPoll = (pollId, cb) => {
        const poll = getPoll(pollId)
        const { expiresIn } = poll
        updatePoll(pollId, {
            active: true,
            begin: () => setTimeout(() => cb(), expiresIn)
        })

        beginPoll(pollId)
    }

    const getPoll = id => pollManager.polls[id]

    const beginPoll = id => pollManager.polls[id].begin()

    const pushPoll = (id = uuid(), block, config = {}) => pollManager.polls[id] = {
        block,
        ...config
    }

    const removePoll = (pollId) => delete pollManager.polls[pollId]

    const updatePoll = (id, conf) => {
        const tmpPoll = { ...pollManager.polls[id] }
        return pollManager.polls[id] = {
            ...tmpPoll,
            ...conf
        }
    }

    const finishPoll = (pollId) => {
        updatePoll(pollId, {
            active: false,
            timer: undefined
        })

        emitResults(pollId)
    }

    const emitResults = async (pollId) => {
        // Send a message with the results of the poll
        const poll = getPoll(pollId)
        const { channel, block, data } = poll

        const resultsBlock = buildPollResultsBlock()

        const result = await web.chat.postMessage({
            channel,
            blocks: resultsBlock,
            attachments: [
                {
                    text: TXT_FINISH_POLL_STANDBY
                }
            ]
        })
    }

    const buildPollResultsBlock = poll => {
        const { blocks } = poll
    }

    // Utils

    const cleanCommands = (cmd) => cmd.map(c => c.substring(1, c.length - 1))

    // Handlers

    const handlePollCreation = async (payload) => {
        const { message: { room, text, user: { name } } } = payload
        let splitCommand = text.split(POLL_KEYWORD)
        const settings = splitCommand[1]

        // All commands should be on quotes (eg. huemul poll "title" "option1" "option 2")
        // The order is important; first one will always be the poll's title. 
        const commands = cleanCommands(settings.match(/(["'])(?:(?=(\\?))\2.)*?\1/g))

        const title = commands[0]
        commands.shift()

        splitCommand = parseTitleAndSubtitle(commands)

        if (splitCommand.length < POLL_MIN_OPTIONS) {
            return await web.chat.postMessage({
                channel: room,
                attachments: [
                    {
                        text: TXT_POLL_MIN_OPTIONS
                    }
                ]
            })
        }

        const options = buildPollOptions(splitCommand)

        const author = bot.brain.usersForFuzzyName(name)[0]

        const pollData = {
            title,
            author,
            options
        }
        const newPoll = buildPollBlock(room, pollData)
        const pollId = newPoll.id
        const pollBlock = newPoll.block

        debug && console.log(pollBlock)
        const response = TXT_CREATING_POLL_STATUS_MESSAGE
        const result = await web.chat.postMessage({
            callback_id: `${ON_POLL_CHOICE}`,
            channel: room,
            text: response,
            blocks: pollBlock,
            attachments: [
                {
                    callback_id: `${ON_POLL_CHOICE}`,
                }
            ]
        })

        if (result) {
            updatePoll(pollId, {
                ts: result.ts
            })
            startPoll(newPoll, () => finishPoll(newPoll))
        }
    }

    const handleUserChoice = payload => {
        // userdata = {
        //     name: data.author.name,
        //     avatar: data.author.slack.profile.image_24 
        // }
        const { } = payload
        /**
         * find poll
         * get user metadata (username, thumbnail)
         * set vote in option
         * refresh poll blocks
         */
    }

    const handleFinishPoll = payload => {
        /**
         * deconstruct payload
         * find poll
         * update poll
         * return message
         */
    }

    const handleRemovePoll = payload => {
        /**
         * deconstruct payload
         * removePoll
         */
    }


    const startPollCleanCron = () => {
        cleaningCron = cron.schedule(cleaningCronSettings, handlePollCleaning)
    }
    const handlePollCleaning = () => {
        debug && console.log("Cleaning inactive polls...")
        Object.keys(pollManager.polls).map((id, i) => !pollManager.polls[id].active && removePoll(id))
    }

    const stopPollCleanCron = () => cleaningCron.stop()

    const exitProcess = () => {
        stopPollCleanCron()
    }


    bot.respond(/(?:poll)(.*)/g, handlePollCreation)
    bot.on(ON_POLL_CHOICE, handleUserChoice)
    bot.on(ON_FINISH_POLL, handleFinishPoll)
    bot.on(ON_REMOVE_POLL, handleRemovePoll)

    startPollCleanCron()
    process.on('exit', exitProcess)
}