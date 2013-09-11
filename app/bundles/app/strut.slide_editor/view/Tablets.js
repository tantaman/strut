define(['./Utils'],
function(Utils) {
	function Tablets(slideEditorModel, tabs) {
		this.$el = $('<div class="tablets">');
		this.tabs = tabs;
		this.model = slideEditorModel;

		this.model.on('change:mode', this._modeChanged, this);

		var self = this;
		this.$el.on('click', 'div', function(e) {
			self._tabClicked(e);
		});
	}

	Tablets.prototype = {
		render: function() {
			this.tabs.forEach(function(tab) {
				var $e = $('<div class="'+tab.key+'" data-key="' + tab.key + '"><i class="icon icon-' + tab.icon + '"></i><span>' + tab.name + '</span></div>');
				if (tab.active)
					$e.addClass('active');
				this.$el.append($e);
			}, this);
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