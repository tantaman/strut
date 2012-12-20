define(['common/Calcium',
		'./Slide'],
function(Calcium, Slide) {
	return Calcium.Model.extend({
		initialize: function() {
			if (!this.get('name')) {
				// New deck
				this.set('slides', new Calcium.Collection())
				this.addSlide();
			} else {
				// Restored deck
			}
		},

		addSlide: function(slide) {
			if (!(slide instanceof Calcium.Model)) {
				slide = new Slide(slide);
			}

			this.get('slides').add(slide);
		},

		constructor: function Deck() {
			Calcium.Model.prototype.constructor.apply(this, arguments);
		}
	});
});