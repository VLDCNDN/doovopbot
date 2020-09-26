const mysql = require('mysql');
const moment = require('moment');

var pool = require('../config/database');
var user = require('./discord_user');

const funcs = {};

////////////////////////////////////////////////
// DATABASE SETUP
///////////////////////////////////////////////
async function login(discordId) {
  let verify = await user.verifyUser(discordId);
  if (verify.length <= 0) {
    return 'Register ka muna ganito -- !register [username sa dovop]';
  }
  let username = verify[0].username;
  let name = verify[0].name;
  let generatedKey = moment().format('YYYYMMDDHHmmss');
  let currentDate = moment().format('YYYY-MM-DD HH:mm:ss');

  let loginQuery = `SELECT * FROM time_logs WHERE ?? = ? AND ?? = ? LIMIT 1`;
  let query = mysql.format(loginQuery, [
    'username',
    username,
    'time_out',
    '0000-00-00 00:00:00',
  ]);

  let response = pool.query(query).then(function (result) {
    if (result.length > 0) {
      if (result[0].status == 1) {
        return 'You are already !in.';
      } else if (result[0].status == 2) {
        // update break
        let breakQuery = `SELECT * FROM time_break_logs WHERE ?? = ? AND ?? = ? LIMIT 1`;
        let query = mysql.format(breakQuery, [
          'generated_key',
          result[0].generated_key,
          'break_out',
          '0000-00-00 00:00:00',
        ]);
        return pool.query(query).then(function (tblResult) {
          if (tblResult) {
            // this date need to be format because the tblResult return this kind of format 'Fri Sep 18 2020 01:31:58'
            let breakInDateTime = moment(tblResult[0].break_in).format(
              'YYYY-MM-DD HH:mm:ss'
            );
            let updateQuery = `UPDATE time_break_logs SET break_out = '${currentDate}' WHERE break_in = '${breakInDateTime}' AND generated_key = '${result[0].generated_key}'`;
            return pool.query(updateQuery).then(function (tblresult) {
              if (tblresult) {
                let updateQuery = `UPDATE time_logs SET status = 1 WHERE id = ${result[0].id}`;
                return pool.query(updateQuery).then(function (result) {
                  return 'Back to work! :desktop:';
                });
              }
              return 'OUT! now take a rest. :relaxed: ';
            });
          }
        });
      }
    } else {
      let insertQuery = `INSERT INTO time_logs (ip_address,username,generated_key,time_in,time_out,status,created) 
                    VALUES ('Discord','${username}', '${generatedKey}','${currentDate}', '0000-00-00 00:00:00', 1,'${currentDate}')`;

      let login = pool.query(insertQuery);
      let loginData = login.then(function (result) {
        if (result) {
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
  if (verify.length <= 0) {
    return 'Register ka muna ganito -- !register [username sa dovop]';
  }
  let username = verify[0].username;
  let name = verify[0].name;
  let currentDate = moment().format('YYYY-MM-DD HH:mm:ss');

  let loginQuery = `SELECT * FROM time_logs WHERE ?? = ? AND ?? = ? AND ?? = ? LIMIT 1`;
  let query = mysql.format(loginQuery, [
    'username',
    username,
    'time_out',
    '0000-00-00 00:00:00',
    'status',
    '1',
  ]);

  let response = pool.query(query).then(function (result) {
    if (result.length > 0) {
      let logId = result[0].id;
      let updateQuery = `UPDATE time_logs SET time_out = '${currentDate}', status = 3 WHERE id = ${logId}`;
      return pool.query(updateQuery).then(function (result) {
        let currentDate = moment().format('YYYY-MM-DD');
        let summaryResponse = timeSummaryFormat(username, currentDate + " 00:00:00", currentDate + " 23:59:59")
          .then(res => {
            return 'OUT! \n' + res;
          });
        return summaryResponse;
      });
    } else {
      return 'Please !in before going !out';
    }
  });

  return await response;
}

async function breaktime(discordId) {
  let verify = await user.verifyUser(discordId);
  if (verify.length <= 0) {
    return 'Register ka muna ganito -- !register [username sa dovop]';
  }
  let username = verify[0].username;
  let name = verify[0].name;
  let currentDate = moment().format('YYYY-MM-DD HH:mm:ss');

  let loginQuery = `SELECT * FROM time_logs WHERE ?? = ? AND ?? = ? AND ?? = ? LIMIT 1`;
  let query = mysql.format(loginQuery, [
    'username',
    username,
    'time_out',
    '0000-00-00 00:00:00',
    'status',
    '1',
  ]);

  let response = pool.query(query).then(function (result) {
    if (result.length > 0) {
      let breakQuery = `SELECT * FROM time_break_logs WHERE ?? = ? AND ?? = ? LIMIT 1`;
      let query = mysql.format(breakQuery, [
        'generated_key',
        result[0].generated_key,
        'break_out',
        '0000-00-00 00:00:00',
      ]);
      let breakQueryResponse = pool.query(query).then(function (result2) {
        if (result2.length > 0) {
          return 'Break again? Mag IN ka muna type mo lang !in to resume';
        } else {
          let insertQuery = `INSERT INTO time_break_logs (generated_key,break_in,break_out,created) 
                        VALUES ('${result[0].generated_key}','${currentDate}', '0000-00-00 00:00:00','${currentDate}')`;
          let breakIn = pool.query(insertQuery);
          let breakInResponse = breakIn.then(function (result3) {
            if (result3) {
              let updateQuery = `UPDATE time_logs SET status = 2 WHERE id = ${result[0].id}`;
              return pool.query(updateQuery).then(function (result) {
                return ` :yum::fork_and_knife:`;
              });
            }
          });
          return breakInResponse;
        }
      });

      return breakQueryResponse;
    } else {
      return 'Mag !in ka muna bago ka mag !break';
    }
  });

  return await response;
}

async function timeSummary(username, startDate, endDate) {
  let query = `SELECT * FROM time_logs WHERE username = '${username}' AND time_in BETWEEN '${startDate}' AND '${endDate}'`;
  let data = await pool.query(query).then((result) => result);
  let firstLogin = "";
  let lastLogout = "";

  let timeSummary = data.map(async (value, index, arr) => {
    let login = moment(value['time_in']);
    let logout = moment(value['time_out']);
    let generated_key = value['generated_key'];
    let duration = moment.duration(logout.diff(login));
    let seconds = duration.asSeconds();

    if(index == 0) firstLogin = value['time_in'];
    if(index == arr.length - 1) lastLogout = value['time_out'];
    let query = `SELECT * FROM time_break_logs WHERE generated_key = '${generated_key}'`;
    let breaksResQuery = await pool.query(query);
    let breaksSeconds = breaksResQuery.map((breakVal,breakIndex,breakArr) => {
        let breakIn = moment(breakVal['break_in']);
        let breakOut = moment(breakVal['break_out']);
        let breakDuration = moment.duration(breakOut.diff(breakIn));
      
        return breakDuration.asSeconds();
      }).reduce((prev,curr) => prev+curr,0);
    
    const summary = {
      totalHours : seconds,
      breakHours : breaksSeconds,
      totalOfficeHours : seconds - breaksSeconds 
    }
    return summary;
  })

  let totalHoursDuration = await timeSummary.reduce(async (prev, cur) => {
    let prevv = await prev;
    let curr = await cur;

    return prevv + await curr.totalHours;
  },0);

  let totalBreakDuration = await timeSummary.reduce(async (prev, cur) => {
    let prevv = await prev;
    let curr = await cur;

    return prevv + await curr.breakHours;
  },0);

  
  let totalOfficeHoursDuration = await timeSummary.reduce(async (prev, cur) => {
    let prevv = await prev;
    let curr = await cur;

    return prevv + await curr.totalOfficeHours;
  },0);

  let total = moment.duration(totalHoursDuration, 'seconds');
  let totalBreak = moment.duration(totalBreakDuration, 'seconds');
  let totalOffice = moment.duration(totalOfficeHoursDuration, 'seconds');

  let summary = {
    firstLogin : firstLogin,
    lastLogin : lastLogout,
    totaltime : total._data,
    breaktime : totalBreak._data,
    officetime : totalOffice._data,
  }

  return summary
}

async function timeSummaryFormat(...params) {
  let username = params[0];
  let sdate = params[1];
  let edate = params[2];
  let type = params[3] ? params[3] : "all"; // all, break, office, total

  let val = await timeSummary(username, sdate, edate);
  if(type === 'break') {
    return "break duration: " + formatDateToString(val.breaktime); 
  } else if (type === 'all') {
    let officeTime = formatDateToString(val.officetime);
    let totalTime = formatDateToString(val.totaltime);
    let breakTime = formatDateToString(val.breaktime);
    let firstLogin = moment(val.firstLogin).format('YYYY-MM-DD hh:mm:ss a');
    let lastLogin = moment(val.lastLogin).format('YYYY-MM-DD hh:mm:ss a');
    return `**SUMMARY** \n :calendar: : ${firstLogin} - ${lastLogin} \n :clock1: : ${totalTime} \n :office: : ${officeTime} \n :fork_and_knife: : ${breakTime}`
  }
}

function formatDateToString(value) {
  let days = value.days > 0 ? value.days + "D": "";
  let hours = value.hours + "h";
  let minute = value.minutes + "m";
  let seconds = value.seconds + "s";
   
  return `${days}${hours} ${minute} ${seconds}`
}

funcs.login = login;
funcs.logout = logout;
funcs.breaktime = breaktime;

module.exports = funcs;
