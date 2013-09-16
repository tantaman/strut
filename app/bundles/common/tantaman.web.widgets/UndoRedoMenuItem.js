define(function() {
	'use strict';

	function UndoRedoMenuItem(options) {
		this.$el = $('<li><a>' + options.title + '<span class="label">' + options.hotkey + '</span></a>'
		+ '</li>');

		this.options = options;
		this.$el.click(this._perform.bind(this));

		this._sub = options.cmdList.on('updated', this._listUpdated, this);
	}

	UndoRedoMenuItem.prototype = {
		render: function() {
			return this;
		},

		_listUpdated: function() {
			var name = this.options.cmdList[this.options.action + 'Name']();
			if (name) {
				var label = this.$el.find('.label');
				label.html(name);
				label.removeClass('dispNone');
			} else {
				var label = this.$el.find('.label');
				label.addClass('dispNone');
			}
		},

		dispose: function() {
			this._sub.dispose();
		},

		_perform: function(e) {
			this.options.handler();
		}
	}

	return UndoRedoMenuItem;
});