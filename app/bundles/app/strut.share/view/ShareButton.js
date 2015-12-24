define(['libs/backbone', 'strut/share/view/SharePopupView'],
function(Backbone, SharePopupView) {
	return Backbone.View.extend({
		className: 'share button',
		events: {
			'click .share': '_showSharePopup'
		},

		initialize: function() {
			this._editorModel = this.options.editorModel;
			delete this.options.editorModel;
                        
                        $("#modals").append("<div id='share-popup' class='hide modal'></div>");
                        var shareView = new SharePopupView({editorModel: this._editorModel, el: $("#share-popup")});
                        shareView.render();
		},

		_showSharePopup: function() {
                    $("body").find("#share-popup").removeClass("hide");
                    mixpanel.track("Button Clicked", {"Name": "Share"});

		},
                
		render: function() {
			this.$el.html('<div class="button"><a class="share"><img src="img/UI_icons/share.png" alt="share"><br>Share</a></div>');
			return this;
		}
	});
});