"use strict";

var fs = require("fs");
var restify = require("restify");
var LineStream = require("lstream");
var CappedArray = require("./cappedArray");
var users = require("../users.json");

function getValidTimestamp(timestamp) {
	if (Number.isNaN(Number(timestamp))) {
		timestamp = Date.parse(timestamp);
		if (Number.isNaN(timestamp)) {
			return false;
		}
	}
	return timestamp;
}

function streamChat(timestamp, number, handler) {
	return new Promise(function (resolve) {
		timestamp = getValidTimestamp(timestamp);
		if (!timestamp) {
			return reject("Bad timestamp");
		}
		if (Number.isNaN(Number(number))) {
			number = 20;
		}

		var readStream = fs.createReadStream("chat.json.lines");
		var lineStream = new LineStream();

		lineStream.on("data", function (line) {
			line = JSON.parse(line);
			if (line.type != "chat" || line.message.substr(0, 12) == "/me is AFK. ") {
				return;
			}

			if (handler(line)) {
				handler = function () {};
				readStream.destroy();
				resolve();
			}
		});

		readStream.pipe(lineStream);

		readStream.once("end", function () {
			resolve();
		});
	});
}

function getSomeBeforeTimestamp(timestamp, number) {
	return new Promise(function (resolve, reject) {
		var lines = new CappedArray(number);
		streamChat(timestamp, number, function (line) {
			if (line.timestamp < timestamp) {
				lines.push(line);
				return false;
			}
			return true;
		}).then(function () {
			return resolve(lines.data);
		})["catch"](reject);
	});
}

function getSomeAfterTimestamp(timestamp, number) {
	return new Promise(function (resolve, reject) {
		var lines = new CappedArray(number);
		streamChat(timestamp, number, function (line) {
			if (line.timestamp > timestamp) {
				lines.push(line);
				if (lines.data.length == number) {
					return true;
				}
			}
			return false;
		}).then(function () {
			return resolve(lines.data);
		})["catch"](reject);
	});
}

var server = restify.createServer({ name: "old-darknet-server", version: "1.0.0" });

server.get("/before/:time", function (req, res, next) {
	getSomeBeforeTimestamp(req.params.time, 20).then(function (lines) {
		res.send(lines);
	})["catch"](function (e) {
		console.error(e);
		res.send(503);
	});
	next();
});

server.get("/before/:time/:count", function (req, res, next) {
	getSomeBeforeTimestamp(req.params.time, req.params.count).then(function (lines) {
		res.send(lines);
	})["catch"](function () {
		console.error(e);
		res.send(503);
	});
	next();
});

server.get("/after/:time", function (req, res, next) {
	getSomeAfterTimestamp(req.params.time, 20).then(function (lines) {
		res.send(lines);
	})["catch"](function () {
		console.error(e);
		res.send(503);
	});
	next();
});

server.get("/after/:time/:count", function (req, res, next) {
	getSomeAfterTimestamp(req.params.time, req.params.count).then(function (lines) {
		res.send(lines);
	})["catch"](function () {
		console.error(e);
		res.send(503);
	});
	next();
});

server.listen(3482, function () {
	console.log("Server " + server.name + " listening at " + server.url);
});