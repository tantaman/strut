define(['css!styles/widgets/widgets.css'],
function(empty) {
	function Dropdown(model, template) {
		this.$el = $('<div class="dropdown">');
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
			this.$el.find('ul').addClass('horizontalDropdown');

			return this;
		},

		dispose: function() {
			if (this._model.off)
				this._model.off(null, null, this);
		}
	}

	return Dropdown;
});