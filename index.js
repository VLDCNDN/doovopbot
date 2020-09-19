const Discord = require("discord.js");
const mysql = require('mysql') 
const config = require("./config.json");
const moment = require("moment")
const client = new Discord.Client();
const prefix = "!";


var pool = require('./database')


////////////////////////////////////////////////
// DATABASE SETUP
///////////////////////////////////////////////
async function register(discordUserId,username) {
    let query = `SELECT * FROM users WHERE username = '${username}' LIMIT 1`;
    let user = pool.query(query);
    
    data = user.then(function(result) {
        if(result.length <= 0) {
            return "Sino ka? Hindi ka pa registered sa Doovop!";
        }

        let name = result[0].first_name;

        let selectQuery = `SELECT * FROM discord_users WHERE doovop_username = '${username}'`;
        let discordUser = pool.query(selectQuery);
        let duData = discordUser.then(function(result2) {
            if(result2.length > 0) {
                return "Registered kana woi!";
            } else {
                let insertQuery = `INSERT INTO discord_users (doovop_username,discord_id) 
                    VALUES ('${username}','${discordUserId}' )`;
                let registered = pool.query(insertQuery)
                let registredData = registered.then(function(result) {
                    return `Oks na! Registered kana ${name}`; 
                });

                return registredData;
            }
        });

        return duData;

    
    });

    return await data;

}

function verifyUser(discordId) {
    let query = `SELECT u.username as username, u.first_name as name FROM discord_users du
        LEFT JOIN users u ON u.username = du.doovop_username
        WHERE du.discord_id = '${discordId}'
    `;
    let data = pool.query(query);
    let user = data.then(function(result){
      return result;
    })

    return user;
}

async function login(discordId) {
    
    let verify = await verifyUser(discordId);
    if(verify.length <= 0) {
        return "Wait! sino ka? Hindi ka pa belong, Register ka muna ganito -- !register [username sa dovop]"
    }
    let username = verify[0].username;
    let name = verify[0].name;
    let generatedKey = moment().format("YYYYMMDDHHmmss");
    let currentDate = moment().format("YYYY-MM-DD HH:mm:ss");


    let loginQuery = `SELECT * FROM time_logs WHERE ?? = ? AND ?? = ? LIMIT 1`;
    let query = mysql.format(loginQuery, ["username", username, "time_out", "0000-00-00 00:00:00"])
    
    let response = pool.query(query).then(function(result) {
        if(result.length > 0) {
            if(result[0].status == 1) {
                return "Naka IN kana."
            } else if (result[0].status == 2) {
                // update break
                let breakQuery = `SELECT * FROM time_break_logs WHERE ?? = ? AND ?? = ? LIMIT 1`;
                let query = mysql.format(breakQuery, ["generated_key", result[0].generated_key, "break_out", "0000-00-00 00:00:00"])
                return pool.query(query).then(function(tblResult) {
                    if(tblResult) {
                        // this date need to be format because the tblResult return this kind of format 'Fri Sep 18 2020 01:31:58'
                        let breakInDateTime = moment(tblResult[0].break_in).format("YYYY-MM-DD HH:mm:ss")
                        let updateQuery = `UPDATE time_break_logs SET break_out = '${currentDate}' WHERE break_in = '${breakInDateTime}' AND generated_key = '${result[0].generated_key}'`;
                        return pool.query(updateQuery).then(function(tblresult) {
                            if(tblresult) {
                                let updateQuery = `UPDATE time_logs SET status = 1 WHERE id = ${result[0].id}`;
                                return pool.query(updateQuery).then(function(result) {
                                    return "Back to work! :desktop:"
                                })
                            }
                            return "OUT! now take a rest. :relaxed: "
                        });
                    }    
                })
                
            }
        } else {
            let insertQuery = `INSERT INTO time_logs (ip_address,username,generated_key,time_in,time_out,status,created) 
                    VALUES ('Discord','${username}', '${generatedKey}','${currentDate}', '0000-00-00 00:00:00', 1,'${currentDate}')`;
    
            let login = pool.query(insertQuery)
            let loginData = login.then(function(result) {
                if(result) {
                    return `You're IN! :clock7: :computer:`;
                }
            });

            return loginData;
        }
    });

    return await response;
    
}

async function logout(discordId) {
    let verify = await verifyUser(discordId);
    if(verify.length <= 0) {
        return "Wait! sino ka? Hindi ka pa belong, Register ka muna ganito -- !register [username sa dovop]"
    }
    let username = verify[0].username;
    let name = verify[0].name;
    let currentDate = moment().format("YYYY-MM-DD HH:mm:ss");

    let loginQuery = `SELECT * FROM time_logs WHERE ?? = ? AND ?? = ? AND ?? = ? LIMIT 1`;
    let query = mysql.format(loginQuery, ["username", username, "time_out", "0000-00-00 00:00:00", "status", "1"])
    
    let response = pool.query(query).then(function(result) {
        if(result.length > 0) {
            let logId = result[0].id;
            let updateQuery = `UPDATE time_logs SET time_out = '${currentDate}', status = 3 WHERE id = ${logId}`;
            return pool.query(updateQuery).then(function(result) {
                return "OUT! now take a rest. :relaxed: "
            });
        } else {
            return "Hindi ka pa nag i-in gusto mo na mag-out! :rofl:"
        }
    })

    return await response;
}

async function breaktime(discordId) {
    let verify = await verifyUser(discordId);if(verify.length <= 0) {
        return "Wait! sino ka? Hindi ka pa belong, Register ka muna ganito -- !register [username sa dovop]"
    }
    let username = verify[0].username;
    let name = verify[0].name;
    let currentDate = moment().format("YYYY-MM-DD HH:mm:ss");

    let loginQuery = `SELECT * FROM time_logs WHERE ?? = ? AND ?? = ? AND ?? = ? LIMIT 1`;
    let query = mysql.format(loginQuery, ["username", username, "time_out", "0000-00-00 00:00:00", "status", "1"])
    
    let response = pool.query(query).then(function(result) {
        if(result.length > 0) {
            let breakQuery = `SELECT * FROM time_break_logs WHERE ?? = ? AND ?? = ? LIMIT 1`;
            let query = mysql.format(breakQuery, ["generated_key", result[0].generated_key, "break_out", "0000-00-00 00:00:00"])
            let breakQueryResponse = pool.query(query).then(function(result2) {
                if(result2.length > 0) {
                    return "Break again? Mag IN ka muna type mo lang !in to resume";
                } else {
                    let insertQuery = `INSERT INTO time_break_logs (generated_key,break_in,break_out,created) 
                        VALUES ('${result[0].generated_key}','${currentDate}', '0000-00-00 00:00:00','${currentDate}')`;
                    let breakIn = pool.query(insertQuery)
                    let breakInResponse = breakIn.then(function(result3) {
                        if(result3) {
                            let updateQuery = `UPDATE time_logs SET status = 2 WHERE id = ${result[0].id}`;
                            return pool.query(updateQuery).then(function(result) {
                                return ` :yum::fork_and_knife:`;
                            })
                            
                        }
                    });
                     return breakInResponse;
                }
            });

            return breakQueryResponse;

            
        } else {
            return "Mag In ka muna siguro bago ka mag break :stuck_out_tongue_winking_eye: "
        }
    })

    return await response;
}

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
        register(discordUserId,args).then(result=> message.reply(result));
    } else if (command === "in") {
        login(discordUserId).then(result => message.reply(result));
    } else if (command === "out") {
        logout(discordUserId).then(result => message.reply(result));
    } else if (command === "break") {
        breaktime(discordUserId).then(result => message.reply(result));
    }
});

client.login(config.BOT_TOKEN);
