requirejs.config({
	baseUrl: "../web/scripts"
});

// Basic sanity checks for prototyping until the real unit tests & dev start
requirejs(["vendor/backbone", "ui/lipstick/binding/Binder"],
function(Backbone, Binder) {
	$(function() {
		var ModelClass = Backbone.Model.extend({
			computed: function() {
				return this.get("weed") + this.get("snow")
			}
		});


		var shortHand = new ModelClass({snow: "white"})
		new Binder({
			model: shortHand,
			el: $("#shortHand"),
			mapping: {
				"text span": "weed",
				"addClass div": "computed",
				"text div": "computed"
			}
		});
		shortHand.set("weed", "short");
		shortHand.set("snow", "hand");




		var longHand = new ModelClass({snow: "white"})
		new Binder({
			model: longHand,
			el: $("#longHand"),
			mapping: {
				"span": {
					fn: "text",
					field: "weed"
				},

				"div": {
					fn: "text",
					field: "computed"
				}
			}
		});

		longHand.set("weed", "long");
		longHand.set("snow", "hand");

		/*
		var BindingView = BindingView.extend({
			mapping: {
				"text span": "weed",
				"addClass div": "computed",
				"text div": "computed"
			}
		});

		new BindingView({
			el: $("#bindingView"),
			model: new ModelClass({snow: "white"})
		});
		*/

	});
});
