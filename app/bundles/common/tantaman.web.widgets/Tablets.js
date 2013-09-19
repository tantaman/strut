define(
function() {
	function Tablets(opts) {
		this._currentItems = [];
		this.$el = $('<div class="tablets hiding">');
		this.template = opts.template;

		var self = this;

		this.$el.on('click', '.tablets-toggle', function(e) {
			self._toggle();
		});
	}

	Tablets.prototype = {
		render: function() {
			this.$el.html(this.template());
			this.$content = this.$el.find('.tablets-content');

			this._currentItems.forEach(function(item) {
				this.$content.append(item.render().$el);
			}, this);

			return this;
		},

		add: function(items) {
			if (!Array.isArray(items))
				items = [items];

			var newItems = [];
			items.forEach(function(item) {
				if (this._currentItems.indexOf(item) == -1)
					newItems.push(item);
			}, this);

			newItems.forEach(function(item) {
				this._currentItems.push(item);
				if (this.$content)
					this.$content.append(item.render().$el);
			}, this);
		},

		dispose: function() {
		},

		_toggle: function() {
			if (this.$el.is('.hiding')) {
				this.$el.removeClass('hiding');
				this.$el.addClass('showing');
			} else {
				this.$el.removeClass('showing');
				this.$el.addClass('hiding');
			}
		}
	}

	return Tablets;
});