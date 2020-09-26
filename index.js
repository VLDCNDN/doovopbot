const Discord = require("discord.js");
const config = require("./config/config.json");
const client = new Discord.Client();
const prefix = "!";

var user = require('./models/discord_user');
var timeLog = require('./models/time_log');

////////////////////////////////////////////////
// DISCORD SETUP - START HERE
///////////////////////////////////////////////

client.on("message", function(message) {
    if(message.author.bot) return;
    if(!message.content.startsWith(prefix)) return;

    const commandBody = message.content.slice(prefix.length);
    const args = commandBody.split(' ');
    const command = args.shift().toLocaleLowerCase();
    const discordUserId = message.member.id;
        
    if(command === "register") {
        user.register(discordUserId,args).then(result=> message.reply(result));
    } else if (command === "in") {
        timeLog.login(discordUserId).then(result => message.reply(result));
    } else if (command === "out") {
        timeLog.logout(discordUserId).then(result => message.reply(result));
    } else if (command === "break") {
        timeLog.breaktime(discordUserId).then(result => message.reply(result));
    }
    
    
    else if (command === "help") {
        message.reply("**Available Commands**: \n **ATTENDANCE** \n - !in - time in \n - !out - time out \n - !break - break time to resume to work type !in \n")
    }
});

client.login(config.BOT_TOKEN);
