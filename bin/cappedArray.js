"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

module.exports = (function () {
	function CappedArray(cap) {
		_classCallCheck(this, CappedArray);

		this.cap = cap;
		this.data = [];
	}

	_createClass(CappedArray, [{
		key: "push",
		value: function push(obj) {
			this.data.push(obj);
			if (this.data.length > this.cap) {
				this.data.shift();
			}
		}
	}, {
		key: "unshift",
		value: function unshift(obj) {
			this.data.unshift(obj);
			if (this.data.length > this.cap) {
				this.data.pop();
			}
		}
	}]);

	return CappedArray;
})();