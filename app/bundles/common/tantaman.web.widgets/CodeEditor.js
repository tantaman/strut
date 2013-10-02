// Editor for "code" which can be styled via some arbitrary class
define(['libs/backbone', 'codemirror/codemirror'],
function(Backbone, CodeMirror) {
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
			var code = this.mirror.getValue();
			this._saveCb(code);
		},

		show: function(savecb, code) {
			this._saveCb = savecb;
			this.$el.modal('show');

			if (!this.mirror) {
				this.mirror = CodeMirror.fromTextArea(this.$input[0], {
					mode: this.options.mode
				});
			}
			
			if (code)
				this.mirror.setValue(code);
		},

		hide: function() {
			this.$el.modal('hide');
		},

		_hidden: function() {
			this.$input.val('');
		},

		render: function() {
			this.$el.html(this.template(this.options));
			this.$el.addClass(this.options.class);
			this.$input = this.$el.find('.codeInput');

			this.$el.modal({
				/*backdrop: 'static',
				keyboard: false,*/
				show: false
			});

			return this;
		},

		constructor: function CodeEditor() {
			Backbone.View.prototype.constructor.apply(this, arguments);
		}
	});
});