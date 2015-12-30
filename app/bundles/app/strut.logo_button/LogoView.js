define(['libs/backbone',
		'./LogoModel',
		'css!styles/logo_button/logo.css'],
function(Backbone, LogoModel) {
	'use strict';
	return Backbone.View.extend({
		className: 'logo-group btn-group',
                
                events: {
                "change #autoPlayTimer" : "setAutoPlayTimer",
                "click .logo": "showMenu",
                "mouseleave .dropdown-menu": "hideMenu"
                },
                
                showMenu: function() {
                    $(".logo-group .dropdown-menu").slideDown();
                },
                
                hideMenu: function() {
                    $(".logo-group .dropdown-menu").slideUp();
                },
                
                setAutoPlayTimer: function(e){
                   
                   var timer = $("#autoPlayTimer").val();
                   window.localStorage.setItem("autoPlayTimer", timer * 1000);
                   mixpanel.track("ChartBook Button Clicked", {"Name": "Autoplay-Timer"});
                },
                
		initialize: function() {
			this._template = JST['strut.logo_button/Logo'];
			this.model = new LogoModel(this.options.editorModel);
			delete this.options.editorModel;
		},

		render: function() {
			this.$el.html(this._template());

			var $dropdown = this.$el.find('.dropdown-menu').height($( window ).height()-40);
                    //.on("mouseout", function(){$(this).css("display", "none")});
			this.model.items.forEach(function(item) {
				$dropdown.append(item.render().$el);
			}, this);
                        $dropdown.append("<li><a>Set AutoPlay Timer</a></br><input type='number' name='quantity' id='autoPlayTimer' style='width: 140px; margin:auto'></li>");
			return this;
		},

		constructor: function LogoView() {
			Backbone.View.prototype.constructor.apply(this, arguments);
		}
	});
});