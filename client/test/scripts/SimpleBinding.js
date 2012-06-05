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

		var model = new ModelClass({snow: "white"})

		new Binder({
			model: model,
			el: $("#testEl"),
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

		model.set("weed", "whacker");
		model.set("snow", "brown");
	});
});
