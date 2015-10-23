const fs = require("fs");
const restify = require("restify");
const LineStream = require("lstream");
const CappedArray = require("./cappedArray");
const users = require("../users.json");

function getValidTimestamp(timestamp) {
	if(Number.isNaN(Number(timestamp))) {
		timestamp = Date.parse(timestamp);
		if(Number.isNaN(timestamp)) {
			return false;
		}
	}
	return timestamp;
}

function streamChat(timestamp, number, handler) {
	return new Promise(resolve => {
		timestamp = getValidTimestamp(timestamp);
		if(!timestamp) {
			return reject("Bad timestamp");
		}
		if(Number.isNaN(Number(number))) {
			number = 20;
		}

		const readStream = fs.createReadStream("chat.json.lines");
		const lineStream = new LineStream();

		lineStream.on("data", line => {
			line = JSON.parse(line);
			if(line.type != "chat" || line.message.substr(0, 12) == "/me is AFK. ") {
				return;
			}

			if(handler(line)) {
				handler = function() { };
				readStream.destroy();
				resolve();
			}
		});

		readStream.pipe(lineStream);

		readStream.once("end", () => {
			resolve();
		});
	});
}

function getSomeBeforeTimestamp(timestamp, number) {
	return new Promise((resolve, reject) => {
		const lines = new CappedArray(number);
		streamChat(timestamp, number, line => {
			if (line.timestamp < timestamp) {
				lines.push(line);
				return false;
			}
			return true;
		}).then(() => resolve(lines.data)).catch(reject);
	});
}

function getSomeAfterTimestamp(timestamp, number) {
	return new Promise((resolve, reject) => {
		const lines = new CappedArray(number);
		streamChat(timestamp, number, line => {
			if (line.timestamp > timestamp) {
				lines.push(line);
				if(lines.data.length == number) {
					return true;
				}
			}
			return false;
		}).then(() => resolve(lines.data)).catch(reject);
	});
}

const server = restify.createServer({ name: "old-darknet-server", version: "1.0.0" });

server.get("/before/:time", (req, res, next) => {
	getSomeBeforeTimestamp(req.params.time, 20)
		.then(lines => {
			res.send(lines);
		})
		.catch(e => {
			console.error(e);
			res.send(503);
		});
	next();
});

server.get("/before/:time/:count", (req, res, next) => {
	getSomeBeforeTimestamp(req.params.time, req.params.count)
		.then(lines => {
			res.send(lines);
		})
		.catch(() => {
			console.error(e);
			res.send(503);
		});
	next();
});

server.get("/after/:time", (req, res, next) => {
	getSomeAfterTimestamp(req.params.time, 20)
		.then(lines => {
			res.send(lines);
		})
		.catch(() => {
			console.error(e);
			res.send(503);
		});
	next();
});

server.get("/after/:time/:count", (req, res, next) => {
	getSomeAfterTimestamp(req.params.time, req.params.count)
		.then(lines => {
			res.send(lines);
		})
		.catch(() => {
			console.error(e);
			res.send(503);
		});
	next();
});

server.listen(3482, () => {
	console.log(`Server ${server.name} listening at ${server.url}`);
});
