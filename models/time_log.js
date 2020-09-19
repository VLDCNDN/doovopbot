const mysql = require('mysql') 
const moment = require("moment")

var pool = require('../config/database')
var user = require('./discord_user');

const funcs = {};

////////////////////////////////////////////////
// DATABASE SETUP
///////////////////////////////////////////////
async function login(discordId) {
    
    let verify = await user.verifyUser(discordId);
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
    let verify = await user.verifyUser(discordId);
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
    let verify = await user.verifyUser(discordId);if(verify.length <= 0) {
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

funcs.login = login;
funcs.logout = logout;
funcs.breaktime = breaktime;

module.exports = funcs;