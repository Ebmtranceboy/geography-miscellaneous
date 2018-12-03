const hidden = require('./hidden');
const telegramBot = require('node-telegram-bot-api');
const token = hidden.TOKEN;
const api = new telegramBot(token, {polling: true});
const exec = require('child-process-async').exec;
const geodbkey = hidden.API_KEY;

let results;
let resultsAvailable = false;
let chatId;
let reference = {};

api.onText(/\/start/, function(msg, match){
	api.sendMessage(msg.chat.id, `Welcome to Greography Miscellaneous! Type
		/nameit <latitude> <longitude>		to know the name of this Earth location
		/reference <name of a location>		to define a point of reference on Earth
		/distance <name of a location>		to compute the distance between a location and a reference previously defined`);
});

const distance = (loc1, loc2) =>{
	const EARTH_RADIUS_KM = 6371.0;
	const R = EARTH_RADIUS_KM;
	const th1 = loc1.geometry.lat * Math.PI / 180.0, th2 = loc2.geometry.lat * Math.PI / 180.0;
	const ph1 = loc1.geometry.lng * Math.PI / 180.0, ph2 = loc2.geometry.lng = Math.PI / 180.0;
	const [x1, y1, z1] = [Math.cos(th1) * Math.cos(ph1), Math.cos(th1) * Math.sin(ph1), Math.sin(th1)];
	const [x2, y2, z2] = [Math.cos(th2) * Math.cos(ph2), Math.cos(th2) * Math.sin(ph2), Math.sin(th2)];
	const alpha = Math.acos((x1*x2+y1*y2+z1*z2)/Math.sqrt(x1*x1+y1*y1+z1*z1)/Math.sqrt(x2*x2+y2*y2+z2*z2));
	return alpha * R;
}

api.onText(/\/reference +([^]+)/, function(msg, match){
	chatId = msg.chat.id;
	async function curl(){
		const req = '"'+`https://api.opencagedata.com/geocode/v1/json?q=${match[1].replace(/ /g,'%20')}&key=${geodbkey}`+'"';
		const child = await exec(`curl ${req}`);
		let resp;
		try{
			resp = JSON.parse(child.stdout);
		} catch(_){}
		if(typeof resp == 'object' && Object.keys(resp).includes("results") && resp.results.length > 0){
			if(resp.results.length == 1){
				const result = resp.results[0];
				reference = {formatted: result.formatted, geometry: result.geometry};
				api.sendMessage(chatId, `Reference set to: ${reference.formatted} (lattitude: ${reference.geometry.lat}$, longitude: ${reference.geometry.lng})`);
			}
			else{
				resultsAvailable = true;
				results = resp.results;
				const keyboard = results.map((res,i) => {return [{text: `${res.formatted}`, callback_data: `R${i}`}];});
				api.sendMessage(chatId, 'Do you mean ?', {reply_markup: JSON.stringify({inline_keyboard: keyboard})});
			}
		}
		else api.sendMessage(chatId, 'Either your request is malformed or nothing like this in the database.');
	}
	curl();
});

api.onText(/\/distance +([^]+)/, function(msg, match){
	chatId = msg.chat.id;
	if(reference.length == 0){
		api.sendMessage(chatId, 'Reference undefined. Type /reference <description> to create one first');
		return;
	}

	async function curl(){
		const req = '"'+`https://api.opencagedata.com/geocode/v1/json?q=${match[1].replace(/ /g,'%20')}&key=${geodbkey}`+'"';
		const child = await exec(`curl ${req}`);
		let resp;
		try{
			resp = JSON.parse(child.stdout);
		} catch(_){}
		if(typeof resp == 'object' && Object.keys(resp).includes("results") && resp.results.length > 0){
			if(resp.results.length == 1){
				const result = resp.results[0];
				const loc = {formatted: result.formatted, geometry: result.geometry};
				api.sendMessage(chatId, `Distance between ${reference.formatted} and ${loc.formatted} is about ${distance(reference,loc)} kms.`);
			}
			else{
				resultsAvailable = true;
				results = resp.results;
				const keyboard = results.map((res,i) => {return [{text: `${res.formatted}`, callback_data: `D${i}`}];});
				api.sendMessage(chatId, 'Do you mean ?', {reply_markup: JSON.stringify({inline_keyboard: keyboard})});
			}
		}
		else api.sendMessage(chatId, 'Either your request is malformed or nothing like this in the database.');
	}
	curl();
});

api.onText(/\/nameit +(-?\d+.?\d*) +(-?\d+.?\d*)/, function (msg, match){
	chatId = msg.chat.id;
	async function curl(){
		const req = '"'+`https://api.opencagedata.com/geocode/v1/json?q=${match[1]}+${match[2]}&key=${geodbkey}`+'"';
		const child = await exec(`curl ${req}`);
		let resp;
		try{
			resp = JSON.parse(child.stdout);
		}catch(_){}
		if(typeof resp == 'object'){api.sendMessage(chatId, resp.results[0].formatted)}
		else api.sendMessage(chatId, 'Malformed request.');
	}
	curl();

});

api.on("callback_query", (cq) => {
	if(resultsAvailable && cq.data[0] == 'R') {
		const result = results[Number(cq.data.slice(1))];
		reference = {formatted: result.formatted, geometry: result.geometry};
		api.sendMessage(chatId, `Reference set to: ${reference.formatted} (lattitude: ${reference.geometry.lat}, longitude: ${reference.geometry.lng})`);
	
		resultsAvailable = false;
	}
	
	else if(resultsAvailable && reference && Object.keys(reference).length > 0 && cq.data[0] == 'D') {
		const result = results[Number(cq.data.slice(1))];
		const loc = {formatted: result.formatted, geometry: result.geometry};
		api.sendMessage(chatId, `Distance between ${reference.formatted} and ${loc.formatted} is about ${distance(reference,loc)} kms.`);
	
		resultsAvailable = false;
	}


	api.answerCallbackQuery(cq.id, {});
});

console.log("Bot loaded.");
