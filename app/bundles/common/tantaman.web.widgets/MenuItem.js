define(function() {
	function MenuItem(options) {
		this.$el = $('<li><a>' + options.title + ' ' + 
			((options.hotkey) ? '<span class="label pull-right">' + options.hotkey + '</span>' : '')
		+ '</a></li>');
		this.$el.click(function() {
			if (options.modal)
				options.modal.show(options.handler, options.title);
			else
				options.handler(options.model);
		});
	}

	MenuItem.prototype = {
		render: function() {
			return this;
		}
	};

	return MenuItem;
});