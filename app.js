const Discord = require('discord.js');
const translate = require('@vitalets/google-translate-api');
const token = require('./token.json');

const transReg = /(^|\s)([\a-zA-Z\-_]*)\?([\a-zA-Z\-_]+)(\^*)([0-9]*)($|\s)/g
const nameReg = /^<\**(.+?)\**>/;

let transAndSend = (msg, from, to) => {

    let name = msg.member.nickname || msg.author.username;
    let text = msg.content.replace(transReg, "");

    if(from.toUpperCase() === to.toUpperCase()) return;

    if(msg.author.username === "Istrolid Chat") {
        let match = null;
        match = nameReg.exec(msg.content); nameReg.lastIndex = 0;
        if(match && match[1]) {
            name = match[1];
            text = text.replace(nameReg, "");
        }
    }

    translate(text, {from: from, to: to}).then(res => {
        if(res.from.language.iso.toUpperCase() !== to.toUpperCase()) {
            msg.channel.send(name + ": " + res.text).catch(console.error);
        }
    }).catch(e => {
        console.error("Translate error", e.code);
        msg.channel.send("Translate error: " + e.message).catch(console.error);
    });
};

var discord = new Discord.Client();

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
    let match = transReg.exec(text); transReg.lastIndex = 0;
    if(match) {

        let from = match[2];
        let to = match[3];

        let num = Number(match[5] || match[4].length);
        if(num > 100) {
            msg.channel.send("Number too large").catch(console.error);
            return;
        } else if(num === 0) {
            transAndSend(msg, from, to);
            return;
        }

        msg.channel.fetchMessages({limit: num, before: msg.id}).then(msgs => {
            if(msgs.size === num) {
                transAndSend(msgs.last(), from, to);
            } else {
                msg.channel.send("Message not found").catch(console.error);
            }
        }).catch(console.error);
    }
});

discord.login(token.token);
