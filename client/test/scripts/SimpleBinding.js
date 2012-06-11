requirejs.config({
	baseUrl: "../web/scripts"
});

// Basic sanity checks for prototyping until the real unit tests & dev start
requirejs(["vendor/backbone", "ui/lipstick/binding/Binder", "ui/lipstick/binding/BindingView"],
function(Backbone, Binder, BindingView) {
	$(function() {
		var ModelClass = Backbone.Model.extend({
			computed: function() {
				return this.get("weed") + this.get("snow")
			}
		});

		// ====== Short Hande binding method ======== //
		var model = new ModelClass({snow: "white"});
		new Binder({
			model: model,
			el: $("#shortHand"),
			mapping: {
				"text span": "weed",
				"addClass div": "computed",
				"text div": "computed"
			}
		});
		model.set("weed", "short");
		model.set("snow", "hand");


		// ======== Extend BindingView using short hand ========= //
		var bv = BindingView.extend({
			mapping: {
				"text span": "weed",
				"addClass div": "computed",
				"text div": "computed"
			}
		});

		bindingViewModel = new ModelClass({snow: "white"});
		new bv({
			el: $("#bindingView"),
			model: bindingViewModel
		});

		bindingViewModel.set("weed", "whacker");


		// ====== Short Hand with middleware ======= //
		model = new ModelClass({snow: "green"});
		new Binder({
			model: model,
			el: $("#withMW"),
			mapping: {
				"text span": "weed",
				"html div": "computed"
			},

			middleware: {
				toView: {
					"span": function(val) {
						return val.toUpperCase();
					},

					"div": function(val) {
						return "<b style='color: green'>" + val + "</b>";
					}
				}
			}
		});

		model.set("weed", "middelwarez");

		window.mwModel = model;


		// ======= LongHand binding method ========== //
		model = new ModelClass({snow: "white"})
		new Binder({
			model: model,
			el: $("#longHand"),
			mapping: {
				"span": {
					fn: "text",
					field: "weed"
				},

				"div": {
					fn: ["text", "addClass"],
					field: "computed"
				},

				"h1": {
					fn: {
						false: ["removeClass", "active"],
						true: ["addClass", "active"]
					},
					field: "thinger"
				}
			}
		});

		model.set("weed", "long");
		model.set("snow", "hand");
		model.set("thinger", true);

		window.longHandModel = model;
	});
});
