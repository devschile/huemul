// Description:
//  In-memory polls. Inspired by SimplePoll & votador.js (@juanbrujo & @antonishen)
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
const atob = require('atob')

const token = process.env.HUBOT_SLACK_TOKEN
const web = new WebClient(token)

const { text, } = object
const {
    button,
} = element
const { section, actions, divider, context, image } = block

// https://gist.github.com/jed/982883
const uuid = function b(a) { return a ? (a ^ Math.random() * 16 >> a / 4).toString(16) : ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, b) }

module.exports = bot => {
    const debug = true
    const MINUTE_IN_MS = 60 * 1e3

    // Used as the main bot command
    const POLL_KEYWORD = 'poll'
    const POLL_MIN_OPTIONS = 2
    const POLL_VOTING_LIMIT = 1

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
    const TXT_VOTE_SUCCESSFUL = '*Poll:* Vote successful'
    const TXT_VOTE_ERROR = '*Poll:* An error ocurred while voting. Please try again.'
    const TXT_VOTE_CANT = '*Poll:* The user can\'t vote or has reached it\'s voting limit in this poll.'
    const TXT_POLL_NOT_FOUND = '*Poll*: Unable to find the selected poll.'

    // Clean scheduler cron settings
    const cleaningCronSettings = "0 * * * *" // every 1 hour https://crontab.guru/every-1-hour
    let cleaningCron = null

    const optionShape = {
        block: {},
        context: {},
    }

    const voterShape = {
        metadata: {
            username: null,
            avatar: null,
        },
        votes: []
    }

    const managedPollShape = {
        active: false,
        expiresIn: .1 * MINUTE_IN_MS,
        begin: null,
        block: {},
        metadata: {},
        voters: []
    }

    const pollMetadataShape = {
        multiple: false,
        limit: POLL_VOTING_LIMIT,
        channel: ''
    }

    const pollManager = {
        scheduled: [],
        polls: {},
    }




    const buildPollOptions = (data, pId) => {
        const options = []
        data.forEach(({ title, subtitle }) => {
            const id = uuid()
            const pollOption = {
                p: pId,
                o: id
            }
            const concatId = Buffer.from(JSON.stringify(pollOption)).toString('base64')

            // debug && console.log(pollOption)
            const block = buildOptionBlock({
                title,
                subtitle,
                value: concatId
            })

            options.push({
                ...optionShape,
                value: id,
                title,
                block,
                context: () => buildOptionContext(pId, id)
            })
        })
        return options
    }


    const buildOptionContext = (pollId = undefined, optId = undefined) => {
        const voters = pollId && optId ? getVotesByPollOption(pollId, optId) : []
        debug && console.log("VOTERS", voters)
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

    const buildAndPushPoll = (data) => {
        const {
            id,
            title,
            author: {
                name,
            },
            options,
            limit,
            multiple,
            expiresIn,
            channel,
        } = {
            ...managedPollShape,
            ...data
        }

        // console.log(data.author.slack.profile)
        debug && console.log("CREATING POLL WITH DATA: ", data)

        const pollId = id
        const header = section(
            text(`*${title}* ${TXT_POLL_BY} @${name}`, TEXT_FORMAT_MRKDWN)
        )
        const _divider = divider()
        const pollActions = buildPollActions(pollId)

        const optionsBlocks = options.map(opt => opt.block)

        const optionsContext = options.map(opt => opt.context())

        const pollBlockData = [
            header,
            _divider,
        ]
        optionsBlocks.forEach((optBlock, i) => {
            pollBlockData.push(optBlock)
            pollBlockData.push(optionsContext[i])
        })

        pollBlockData.push(_divider)
        pollBlockData.push(pollActions)

        pushPoll(pollId, {
            block: pollBlockData,
            metadata: {
                ...pollMetadataShape,
                title,
                author: name,
                channel,
                limit,
                multiple,
            },
            options,
            expiresIn,
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
        // const votersBlock = buildOptionContext(pollId, optionId)
        return section(
            text(`*${title}*${subtitle !== null ? `\n${subtitle}` : ''}`, TEXT_FORMAT_MRKDWN),
            {
                accessory: newButton
            }
        )
    }

    // Poll management

    const startPoll = (pollId, cb) => {
        const poll = getPoll(pollId)
        if (poll) {
            const { expiresIn } = poll
            poll.begin = () => setTimeout(() => cb(), expiresIn)

            poll.timer = poll.begin()
        }
    }

    const getPoll = id => pollManager.polls[id]

    const getOptionFromPoll = (pollId, optId) => {
        const poll = getPoll(pollId)
        if (poll) {
            return poll.options[optId]
        }
        return undefined

    }

    const beginPoll = id => {
        const poll = getPoll(id)
        if (poll && !poll.active) {
            console.log("BEGINNING POLL TIMER")
            poll.timer = poll.begin()
        }
    }

    const pushPoll = (id = uuid(), config = {}) => {
        pollManager.polls[id] = {
            ...managedPollShape,
            ...config
        }
        debug && console.log("POLL MANAGER: ", pollManager)
    }

    const removePoll = (pollId) => delete pollManager.polls[pollId]

    const updatePoll = (id, conf) => {
        const tmpPoll = getPoll(id)
        if (tmpPoll) {
            return pollManager.polls[id] = {
                ...tmpPoll,
                ...conf
            }
        }
    }

    const finishPoll = (pollId) => {
        const poll = getPoll(pollId)
        if(poll) {
            poll.timer = undefined
            poll.active = false
    
            emitResults(pollId)
        }
    }

    const emitResults = async (pollId) => {
        // Send a message with the results of the poll
        const poll = getPoll(pollId)
        debug && console.log("EMITTING RESULTS FOR POLL: ", poll)
        if (poll) {
            const { metadata: { channel }, block } = poll

            debug && console.log(poll)
            const resultsBlock = buildPollResultsBlock(pollId)

            return await web.chat.postMessage({
                channel,
                blocks: resultsBlock,
                attachments: [
                    {
                        text: TXT_FINISH_POLL_STANDBY
                    }
                ]
            })
        } else {
            return await web.chat.postMessage({
                channel,
                attachments: [
                    {
                        text: TXT_POLL_NOT_FOUND
                    }
                ]
            })
        }
    }

    const buildPollResultsBlock = poll => {
        const { voters } = poll
    }

    // Utils

    const parseTitleAndSubtitle = commands => commands.map(cmd => {
        const split = cmd.split(TXT_TITLE_SEPARATOR)
        return {
            title: split[0],
            subtitle: split[1] ? split[1] : undefined
        }
    })


    const getVotesByPollOption = (pollId, optId) => {
        const poll = getPoll(pollId)
        if (poll) {
            const pollVoters = poll.voters
            const optionVoters = Object.keys(pollVoters)
                .map((vk) => pollVoters[vk].votes)
                .reduce((acc, curr, i, arr) => curr[optId] && acc.push(pollVoters[i].metadata), [])

            return optionVoters
        }
        return []
    }

    const cleanCommands = (cmd) => cmd.map(c => c.substring(1, c.length - 1))

    const canUserVoteOnPollOption = (pollId, optionId, username) => {
        const poll = getPoll(pollId)
        if (poll) {
            const voters = poll.voters
            if (!voters[username]) {
                return true
            } else {
                const { limit, multiple } = poll.metadata
                const voterData = voters[username]
                const userVoteCount = Object.keys(voterData).length
                // debug && console.log("LIMIT: ", limit, "MULTIPLE: ", multiple, "VOTER DATA: ", voterData)
                if (userVoteCount > 0 && (limit === userVoteCount || !multiple)) return false
                if (voterData[optionId]) return false
                return true
            }
        }
        return false
    }

    // Handlers

    const handlePollCreation = async (payload) => {
        const { message: { room: channel, text, user: { name } } } = payload
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
                channel,
                attachments: [
                    {
                        text: TXT_POLL_MIN_OPTIONS
                    }
                ]
            })
        }
        const pollId = uuid()
        const options = buildPollOptions(splitCommand, pollId)

        const author = bot.brain.usersForFuzzyName(name)[0]

        const pollData = {
            id: pollId,
            title,
            author,
            options,
            channel,
        }
        const newPoll = buildAndPushPoll(pollData)
        // const pollId = newPoll.id
        const pollBlock = newPoll.block

        debug && console.log(pollBlock)
        const response = TXT_CREATING_POLL_STATUS_MESSAGE
        const result = await web.chat.postMessage({
            callback_id: `${ON_POLL_CHOICE}`,
            channel,
            text: response,
            blocks: pollBlock,
            attachments: [
                {
                    callback_id: `${ON_POLL_CHOICE}`,
                }
            ]
        })

        if (result) {
            const poll = getPoll(newPoll.id)
            poll.ts = result.ts
            startPoll(newPoll.id, () => finishPoll(newPoll.id))
        }
    }

    const handleUserChoice = async payload => {
        const { user: { username }, actions, channel: { id: channelId } } = payload

        const data = bot.brain.usersForFuzzyName(username)[0]

        const userData = {
            name: data.name,
            avatar: data.slack.profile.image_24
        }
        const optionData = actions.shift()

        // debug && console.log(payload)

        // const optionDeconstructed = Buffer.from(optionData.value, 'base64')
        // debug && console.log(JSON.parse(atob(optionDeconstructed)))

        const parsedMetadata = JSON.parse(atob(Buffer.from(optionData.value, 'base64')))
        // debug && console.log("PARSED: ", parsedMetadata)
        const { p: pollId, o: optionId } = parsedMetadata
        debug && console.log(pollId, optionId, username)

        if (pollId && optionId) {
            const userCanVote = canUserVoteOnPollOption(pollId, optionId, username)
            if (userCanVote) {
                const pollVote = doVotePoll(pollId, optionId, username)
                if (pollVote) {
                    return await web.chat.postMessage({
                        channel: channelId,
                        attachments: [
                            {
                                text: TXT_VOTE_SUCCESSFUL
                            }
                        ]
                    })
                }
            } else {
                return await web.chat.postMessage({
                    channel: channelId,
                    attachments: [
                        {
                            text: TXT_VOTE_CANT
                        }
                    ]
                })
            }

            /**
             * TODO: update poll blocks
             */
        }

        return await web.chat.postMessage({
            channel: channelId,
            attachments: [
                {
                    text: TXT_VOTE_ERROR
                }
            ]
        })

        // debug && console.log(actions)

        /**
         * find poll
         * get user metadata (username, thumbnail)
         * set vote in option
         * refresh poll blocks
         */
    }

    const doVotePoll = (pollId, optionId, username) => {
        /**
         * Get poll
         * insert voter if not present
         * push option key
         * update poll
         * return boolean
         */
        const poll = getPoll(pollId)
        // debug && console.log("POLL FOUND", poll)
        if (poll) {
            const newVoters = { ...poll.voters }
            if (newVoters[username]) {
                newVoters[username][optionId] = true
            } else {
                newVoters[username] = {
                    [optionId]: true
                }
            }
            poll.voters = { ...newVoters }
            debug && console.log("NEW VOTERS", newVoters)
            return true
        }

        return false

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