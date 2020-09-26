const moment = require("moment")
var pool = require('../config/database')

const funcs = {};

async function getClientBugs() {
    let query = `SELECT bugs.id, bugs.title, bug_status.name as status, users.username,users.first_name,discord_users.discord_id as discord_tag,products.name as product_name,severities.name as severity,bugs.deadline,clients.name as client_name FROM bugs 
        LEFT JOIN products ON products.id = bugs.product_id
        LEFT JOIN severities ON severities.id = bugs.severity_id
        LEFT JOIN bug_status ON bug_status.id = bugs.status_id
        LEFT JOIN users ON users.id = bugs.assign_to_dev_id
        LEFT JOIN discord_users ON discord_users.doovop_username = users.username
        LEFT JOIN clients ON clients.id = bugs.client_id
        WHERE bugs.client_id != 79 AND ticket_classification_id = 7 AND bugs.status_id NOT IN (13, 5)
        ORDER BY bugs.deadline ASC`;

    let clientBugs = await pool.query(query);

    let cbMapped = clientBugs.map((curr, index) => {
        let id = curr.id;
        let title = curr.title;
        let status = curr.status;
        let username = curr.username;
        let firstName = curr.first_name;
        let discordTag = curr.discord_tag;
        let productName = curr.product_name;
        let severity = curr.severity;
        let deadline = moment(curr.deadline).format('YYYY-MM-DD');
        let clientName = curr.client_name;

        let sla = "";
        if(severity === "SLA 1 - Critical") {
            sla = ":red_circle:"
        } else if(severity === "SLA 2 - Major") {
            sla = ":orange_circle:"
        } else if(severity === "SLA 3 - Minor") {
            sla = ":green_circle:"
        } else if(severity === "SLA 4 - Trivial") {
            sla = ":blue_circle:"
        }

        let toTag = discordTag != null ? "<@" +discordTag +">": firstName
        return `${toTag} - ${sla} \`[${id}][${status}][${clientName}] ${title}\` -- **DUE:** ${deadline} `
    });

    return cbMapped.join('\n');
}

funcs.getClientBugs = getClientBugs;
module.exports = funcs;