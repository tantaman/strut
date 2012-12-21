define(['libs/backbone',
		'./SlideWell'],
function(Backbone, SlideWell) {
	return Backbone.View.extend({
		className: 'slideEditor row-fluid',

		initialize: function() {
			//this._template = JST['bundles/slide_editor/templates/SlideEditor'];
			this._well = new SlideWell(this.model.deck(), this.options.registry);
		},

		remove: function() {
			Backbone.View.prototype.remove.call(this);
			this.model.dispose();
		},

		render: function() {
			this.$el.html(); //this._template()
			this.$el.append(this._well.render().$el);
			this.$el.append('<div class="operatingTable"></div>');
			return this;
		},

		constructor: function SlideEditorView() {
			Backbone.View.prototype.constructor.apply(this, arguments);
		}
	});
});