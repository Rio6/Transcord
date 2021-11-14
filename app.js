const Discord = require('discord.js');
const translate = require('@vitalets/google-translate-api');
const token = require('./token.json');

const transReg = /([\a-zA-Z\-_]*)\?([\a-zA-Z\-_]+)(\^*)([0-9]*)/
const nameReg = /^<\**(.+?)\**>/;
const tokenReg = /`(.+?)`/g;

translate.languages['zh'] = translate.languages['zh-CN'];

const generatePlaceholder = () => {
    return Array.from(new Array(20)).map(() => String.fromCharCode(
        Math.floor(Math.random() * 26) + 'A'.charCodeAt(0)
    )).join('');
};

const transAndSend = (msg, from, to) => {

    let name = msg.member.nickname || msg.author.username;
    let text = msg.content.replace(transReg, "");

    if(from.toUpperCase() === to.toUpperCase()) return;

    if(msg.author.username === "Istrolid Chat") {
        const match = nameReg.exec(msg.content);
        if(match && match[1]) {
            name = match[1];
            text = text.replace(nameReg, "");
        }
    }

    const tokens = [];
    text = text.replaceAll(tokenReg, (match, value) => {
        let placeholder;
        do {
            placeholder = generatePlaceholder();
        } while(text.includes(placeholder));
        tokens.push({ value, placeholder });
        return placeholder;
    });

    console.log(text, tokens);

    translate(text, {from: from, to: to}).then(res => {
        if(res.from.language.iso.toUpperCase() !== to.toUpperCase()) {
            let text = res.text;
            tokens.forEach(({ value, placeholder }) => {
                console.log(text, value, placeholder);
                text = text.replaceAll(new RegExp(placeholder, 'gi'), value);
            });
            msg.channel.send(name + ": " + text).catch(console.error);
        }
    }).catch(e => {
        console.error("Translate error", e.code);
        msg.channel.send("Translate error: " + e.message).catch(console.error);
    });
};

const discord = new Discord.Client();

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

    const text = msg.content;
    const match = transReg.exec(text);
    if(match) {

        const from = match[1];
        const to = match[2];

        const num = Number(match[4] || match[3].length);
        if(num > 100) {
            msg.channel.send("Number too large").catch(console.error);
            return;
        } else if(num === 0) {
            transAndSend(msg, from, to);
            return;
        }

        msg.channel.messages.fetch({limit: num, before: msg.id}).then(msgs => {
            if(msgs.size === num) {
                transAndSend(msgs.last(), from, to);
            } else {
                msg.channel.send("Message not found").catch(console.error);
            }
        }).catch(console.error);
    }
});

discord.login(token.token);
