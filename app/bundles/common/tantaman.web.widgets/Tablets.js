define(
function() {
	function Tablets(opts) {
		this.$el = $('<div class="tablets">');
		this.template = opts.template;
		this.tabs = opts.tabs;
		this.model = opts.model;

		this.model.on('change:active', this._activeChanged, this);

		var self = this;
		this.$el.on('click', '.tablets-content > div', function(e) {
			self._tabClicked(e);
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
		}
	}

	return Tablets;
});