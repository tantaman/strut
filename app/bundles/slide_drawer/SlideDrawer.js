define(
function() {
	'use strict';

	function SlideDrawer(model, g2d) {
		this.model = model;
		this.g2d = g2d;

		this.repaint = this.repaint.bind(this);
		this.repaint = _.debounce(this.repaint, 250);

		this.model.on('contentsChanged', this.repaint, this);
		this.size = {
			width: this.g2d.canvas.width,
			height: this.g2d.canvas.height
		};

		this.scale = {
			x: this.size.width / config.slide.size.width,
			y: this.size.height / config.slide.size.height
		};

		
	}

	SlideDrawer.prototype = {

	};

	return SlideDrawer;
}