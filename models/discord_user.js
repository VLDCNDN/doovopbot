const moment = require("moment")
var pool = require('../config/database')

const funcs = {};

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

funcs.register = register;
funcs.verifyUser = verifyUser;

module.exports = funcs;