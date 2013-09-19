define(
function() {
	function Tablets(opts) {
		this.$el = $('<div class="tablets hiding">');
		this.template = opts.template;
		this.tabs = opts.tabs;
		this.model = opts.model;

		this.model.on('change:active', this._activeChanged, this);

		var self = this;
		this.$el.on('click', '.tablets-content > div', function(e) {
			self._tabClicked(e);
		});

		this.$el.on('click', '.tablets-toggle', function(e) {
			self._toggle();
		});
	}

	Tablets.prototype = {
		render: function() {
			this.$el.html(this.template(this.tabs));
			return this;
		},

		dispose: function() {
			this.model.off(null, null, this);
		},

		_activeChanged: function(model, tab) {
			this.$el.find('.active').removeClass('active');
			var $tab = this.$el.find('.' + mode);
			$tab.addClass('active');
		},

		_tabClicked: function(e) {
			this.model.toggle(e.currentTarget.dataset.key);
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