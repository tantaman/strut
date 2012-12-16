define(['libs/backbone',
		'bundles/logo_button/view/LogoView',
		'bundles/presentation_generator/view/PreviewButton',
		'css!styles/header/header.css'],
function(Backbone, LogoView, PreviewButton, empty) {
	return Backbone.View.extend({
		className: 'navbar navbar-inverse navbar-fixed-top',

		initialize: function() {
			this._template = JST['bundles/header/templates/Header'];
			this._logoButton = new LogoView();
			this._previewButton = 
				new PreviewButton({editorModel: this.model.editorModel()});
		},

		// TODO: need to respond to addition/removal of
		// create component buttons
		render: function() {
			this.$el.html(this._template());

			this.$el.find('.logo-holder').append(this._logoButton.render().$el);

			var $modeButtons = this.$el.find('.mode-buttons');
			this.model.get('modeButtons').forEach(function(button) {
				$modeButtons.append(button.render().el);
			}, this);

			var $createCompButtons = this.$el.find('.create-comp-buttons');
			this.model.get('createCompButtons').forEach(function(button) {
				$createCompButtons.append(button.render().el);
			}, this);

			//var $generatorButton = this.$el.find('.preview-generator-button');
			$modeButtons.append(this._previewButton.render().$el);

			return this;
		},

		constructor: function HeaderView() {
			Backbone.View.prototype.constructor.apply(this, arguments);
		}
	});
});