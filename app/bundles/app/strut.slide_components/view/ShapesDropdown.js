define(['tantaman/web/widgets/Dropdown',
		'tantaman/web/widgets/Utils'],
function(Dropdown, Utils) {
	function ShapesDropdown() {
		Dropdown.apply(this, arguments);
	}

	var proto = ShapesDropdown.prototype = Object.create(Dropdown.prototype);

	proto.render = function() {
		Dropdown.prototype.render.apply(this, arguments);

		// apply "scaling" via bullshit size on .shape elements.
		// var self = this;
		// setTimeout(function() {
		// 	Utils.fitSizeToScale(self.$el.find('.shape > div'), 0.5);
		// }, 0);

		return this;
	};

	return ShapesDropdown;
});