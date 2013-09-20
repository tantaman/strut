define(['libs/backbone','css!styles/widgets/widgets.css'],
function(Backbone, empty) {

	/**
	 * @class Dropdown
	 * @param model
	 * @param template
	 * @param options
	 */
	function Dropdown(model, template, options) {
		this.$el = $('<div class="dropdown btn-group">');
		this.el = this.$el[0];
		if (options && options.class) {
			this.$el.addClass(options.class);
		}

		this._template = template;

		var self = this;
		this.$el.on('destroyed', function() {
			self.dispose();
		});

		this._model = model;
		if (model.on)
			model.on('change', this._render, this);
	}

	Dropdown.prototype = {
		render: function() {
			var data;
			if (this._model.attributes)
				data = this._model.attributes;
			else
				data = this._model;

			this.$el.html(this._template(data));

			return this;
		},

		dispose: function() {
			if (this._model.off)
				this._model.off(null, null, this);
			this.off();
		}
	};

	_.extend(Dropdown.prototype, Backbone.Events);

	return Dropdown;
});