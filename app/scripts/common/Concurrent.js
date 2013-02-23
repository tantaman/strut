define(function() {
	function Countdown(num, completionCb, stepCb) {
		this.num = num;
		this.stepCb = stepCb;
		this.completionCb = completionCb;
		this.decrement = this.decrement.bind(this);
	}

	Countdown.prototype = {
		decrement: function() {
			--this.num;
			if (this.num < 0) {
				throw "Countdown less than zero";
			}

			this.stepCb.apply(null, arguments);
			if (this.num == 0) {
				this.completionCb.apply(null, arguments);
			}
		}
	};

	return {
		countdown: Countdown
	}
});