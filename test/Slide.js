define(["model/presentation/Slide"],
function(Slide) {
	var slide;

	function MockComponent() {
		this.attrs = {
			x: 0,
			y: 0
		};
	}

	MockComponent.prototype = {
			on: function() {

			},

			get: function(key) {
				var result = this.attrs[key];
				console.log(result);
				return result;
			},

			set: function(key, value) {
				if (_.isObject(key)) {
					_.extend(this.attrs, key);
				} else {
					this.attrs[key] = value;
				}
			},

			trigger: function() {

			},

			off: function() {

			}
		};

	module("Slide", {
		setup: function() {
			slide = new Slide();
		}
	});

	test("Add component", function() {
		var contentsChanged = false;
		var addTriggered = false;
		slide.on("contentsChanged", function() {
			contentsChanged = true;
		});

		slide.on("change:components.add", function() {
			addTriggered = true;
		});

		slide.add(new MockComponent());

		equal(contentsChanged, true, "contentsChanged event triggered");
		equal(addTriggered, true, "add event triggered");

		var comp = new MockComponent();
		slide.add(comp);

		equal(comp.get("x"), 20, "Offset from existing component");
		equal(comp.get("y"), 20, "Offset from existing component");
		equal(slide.get("components").length, 2, "Two components present");
	});

	test("remove component", function() {
		var contentsChanged = false;
		var removeTriggered = false;

		var comp = new MockComponent();
		slide.add(comp);

		slide.on("contentsChanged", function() {
			contentsChanged = true;
		});

		slide.on("change:components.remove", function() {
			removeTriggered = true;
		});

		slide.remove(comp);

		equal(contentsChanged, true, "contentsChanged triggered");
		equal(removeTriggered, true, "remove triggered");
	});

	// test("dispose", function() {

	// });

	// test("unselect components", function() {

	// });

	// test("Change selection", function() {

	// });

	// test("Update contained component", function() {

	// });
});