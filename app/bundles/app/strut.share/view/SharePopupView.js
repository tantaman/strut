define(['libs/backbone', 'css!styles/share/popup.css'],
function(Backbone) {
	return Backbone.View.extend({
                events: {
                    "click .ok": "okClicked",
                    "click .close": "_closePopup",
                    "click .btn-cancel": "_closePopup",
                    "click #share-menu a": "_showContent",
                    "click #share-add-others" : "_addOthers"
                },
		initialize: function() {
			this._editorModel = this.options.editorModel;
			delete this.options.editorModel;
                        
                        this._template = JST['strut.share/Popup'];
                        this.render();
		},
                _showContent: function(e) {
                    var $this = $(e.currentTarget);
                    $this.addClass("active").siblings().removeClass("active");
                    var target = $this.attr("for");
                    $("#"+target).removeClass("hide").siblings().addClass("hide");
                },
                okClicked: function () {
                    if (!this.$el.find(".ok").hasClass("disabled")) {
                        return this.$el.modal('hide');
                    }
                },
                _closePopup: function () {
                    this.$el.addClass('hide');
                },
		render: function() {
                    this.$el.html(this._template({title: "Chartbook Share"}));	
                    return this;
		}
	});
});