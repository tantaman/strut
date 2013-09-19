define(['./Utils'],
function(Utils) {
	function Tablets(slideEditorModel, tabs) {
		this.$el = $('<div class="tablets">');
		this.template = JST['strut.slide_editor/Tablets'];
		this.tabs = tabs;
		this.model = slideEditorModel;

		this.model.on('change:mode', this._modeChanged, this);

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

		_modeChanged: function(model, mode) {
			this.$el.find('.active').removeClass('active');
			var $tab = this.$el.find('.' + mode);
			$tab.addClass('active');
		},

		_tabClicked: function(e) {
			this.model.set('mode', e.currentTarget.dataset.key);
		}
	}

	return Tablets;
});