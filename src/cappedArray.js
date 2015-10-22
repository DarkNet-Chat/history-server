module.exports = class CappedArray {
	constructor(cap) {
		this.cap = cap;
		this.data = [ ];
	}

	push(obj) {
		this.data.push(obj);
		if (this.data.length > this.cap) {
			this.data.shift();
		}
	}

	unshift(obj) {
		this.data.unshift(obj);
		if(this.data.length > this.cap) {
			this.data.pop();
		}
	}
}
