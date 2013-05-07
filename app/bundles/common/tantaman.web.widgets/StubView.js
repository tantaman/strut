define(function() {
	function StubView($el) {
		this.$el = $el;
	}

	StubView.prototype = {
		render: function() { return this; }
	}

	return StubView;
});