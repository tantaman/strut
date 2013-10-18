define(
function() {
	function InputRequestModal(options) {
		this.$el = $('<div class="modal hide"></div>');
		this._okClicked = this._okClicked.bind(this);
		this.$el.on('click', '.ok', this._okClicked);
		this.options = options;

		this.$el.modal({
			show: false
		});
	}

	InputRequestModal.prototype = {
		render: function() {
			this.$el.html(
				JST['tantaman.web.widgets/InputRequestModal'](this.options));
			this.$input = this.$el.find('input');
			this.$errors = this.$el.find('.errors');

			return this;
		},

		show: function(cb, value) {
			this.cb = cb;
			if (value)
				this.$input.val(value);
			this.$errors.html('');
			this.$el.modal('show');
		},

		hide: function() {
			this.$el.modal('hide');
		},

		_okClicked: function() {
			var input = this.$input.val();
			var result = this.cb(input);
			if (result == true)
				this.hide();
			else {
				this.$errors.html(JST['tantaman.web.widgets/List'](result.errors));
			}
		}
	}

	return InputRequestModal;
});