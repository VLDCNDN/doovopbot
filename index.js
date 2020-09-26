const Discord = require('discord.js');
const config = require('./config/config.json');
const client = new Discord.Client();
const prefix = '!';
const moment = require('moment');

var user = require('./models/discord_user');
var timeLog = require('./models/time_log');
var bug = require('./models/bug');

////////////////////////////////////////////////
// DISCORD SETUP - START HERE
///////////////////////////////////////////////
client.on('ready', () => {
  setInterval(function () {
    let time= moment().format("HH:mm");
    let mess = "\n\n **CLIENT BUG UPDATES**:\n > :red_circle:-SLA1  :orange_circle:-SLA2  :green_circle:-SLA3  :blue_circle:-SLA4 \n\n";
    if(time == "07:00") {
        let toSend = ":city_sunset: GOOD MORNING DEVS " + mess;
        bug.getClientBugs().then(result=>{
            client.channels.cache.get('748378871786635374').send(toSend + result);
    
        });
    } else if (time == "16:00") {
        let toSend = ":city_dusk: GOOD AFTERNOON DEVS " + mess;
        bug.getClientBugs().then(result=>{
            client.channels.cache.get('748378871786635374').send(toSend + result);
    
        });
    }
    },60000);
});

client.on('message', function (message) {
  if (message.author.bot) return;
  if (!message.content.startsWith(prefix)) return;

  const commandBody = message.content.slice(prefix.length);
  const args = commandBody.split(' ');
  const command = args.shift().toLocaleLowerCase();
  const discordUserId = message.member.id;

  if (command === 'register') {
    user.register(discordUserId, args).then((result) => message.reply(result));
  } else if (command === 'in') {
    timeLog.login(discordUserId).then((result) => message.reply(result));
  } else if (command === 'out') {
    timeLog.logout(discordUserId).then((result) => message.reply(result));
  } else if (command === 'break') {
    timeLog.breaktime(discordUserId).then((result) => message.reply(result));
  } else if (command === 'help') {
    message.reply(
      '**Available Commands**: \n **ATTENDANCE** \n - !in - time in \n - !out - time out \n - !break - break time to resume to work type !in \n'
    );
  } else if (command === 'test') {
    bug.getClientBugs().then(result=>{
        let mess = "**HELLO Devs** \n\n Client Bugs updates:\n :red_circle:-SLA1 :orange_circle:-SLA2 :green_circle:-SLA3 :blue_circle:-SLA4 \n\n" + result;
        client.channels.cache.get('748378871786635374').send(mess);
    });
  }

});

// client.on
// setInterval(function () {
//   //this code runs every second
//   client
//     .on('message', function (message) {
//       client.channels.cache.get('759361565593174017').send('Hello here!');
//     })
//     .setMaxListeners(5);
// }, 5000);

client.login(config.BOT_TOKEN);
