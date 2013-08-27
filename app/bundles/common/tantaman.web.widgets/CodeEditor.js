// Editor for "code" which can be styled via some arbitrary class
define(['libs/backbone'],
function(Backbone) {
	// TODO: provide a meaningful way to cancel edits (e.g. restore previous state of
	// the editor, not just ignore changes)
	return Backbone.View.extend({
		className: 'CodeEditor modal hide',
		events: {
			'click .ok': 'saveCode',
			'click .cancel': 'hide',
			'hidden': '_hidden'
		},

		initialize: function() {
			this.template = JST['tantaman.web.widgets/CodeEditor'];
		},

		saveCode: function() {
			this._saved = true;
			var code = this.$input.val();
			this._saveCb(code);
		},

		show: function(savecb) {
			this._saved = false;
			this._oldCode = this.$input.val();
			this._saveCb = savecb;
			this.$el.modal('show');
		},

		hide: function() {
			this.$el.modal('hide');
		},

		_hidden: function() {
			if (!this._saved)
				this.$input.val(this._oldCode);
			this._oldCode = '';
		},

		render: function() {
			this.$el.html(this.template(this.options));
			this.$el.addClass(this.options.class);
			this.$input = this.$el.find('.codeInput');

			this.$el.modal({
				backdrop: 'static',
				keyboard: false
			});

			return this;
		},

		constructor: function CodeEditor() {
			Backbone.View.prototype.constructor.apply(this, arguments);
		}
	});
});