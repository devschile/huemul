// Description:
//  Devuelve el link al canal de devsChile en discord
//
// Commands:
//  hubot discord
//
// Author:
//  @fskarmeta

const discordLink = "https://discord.gg/dKmPnpu5rY"

module.exports = robot => robot.respond(/discord/gi, msg => msg.send(`Aquí tienes el link al discord de devsChile: ${discordLink}`));
