define(function() {
	function MenuItem(title, modal, handler, editorModel) {
		this.$el = $('<li><a>' + title + '</a></li>');
		this.$el.click(function() {
			if (modal)
				modal.show(handler, title);
			else
				handler(editorModel);
		});
	}

	MenuItem.prototype = {
		render: function() {
			this.$el.html();
			return this;
		}
	};

	return MenuItem;
});