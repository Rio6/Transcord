const Discord = require('discord.js');
const translate = require('@vitalets/google-translate-api');
const token = require('./token.json');

let transAndSend = (msg, to) => {
    translate(msg.content.replace(regex, ""), {to: to}).then(res => {
        let name = msg.member.nickname || msg.author.username;
        msg.channel.send(name + ": " + res.text).catch(console.error);
    }).catch(e => {
        console.error("Translate error", e.code);
        msg.channel.send("Translate error: " + e.message).catch(console.error);
    });
};

var discord = new Discord.Client();
const regex = /\?([\a-zA-Z\-_]+)(\^*)([0-9]*)/g

discord.on('ready', () => {
    console.log(`${discord.user.tag}` + " ready");
});

discord.on('disconnect', () => {
    console.log("Disconnected");
    process.exit();
});

discord.on('error', e => console.error("Discord error", e));

discord.on('message', msg => {
    if(!msg.member || msg.author.username === discord.user.username)
        return;

    let text = msg.content;
    let match = regex.exec(text);
    if(match) {
        regex.lastIndex = 0;

        let to = match[1];

        let num = Number(match[3] || match[2].length);
        if(num > 100) {
            msg.channel.send("Number too large").catch(console.error);
            return;
        } else if(num === 0) {
            transAndSend(msg, to);
            return;
        }

        msg.channel.fetchMessages({limit: num, before: msg.id}).then(msgs => {
            if(msgs.size === num) {
                transAndSend(msgs.last(), to);
            } else {
                msg.channel.send("Message not found").catch(console.error);
            }
        }).catch(console.error);
    }
});

discord.login(token.token);
