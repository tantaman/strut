define(["model/presentation/Deck"],
function(Deck) {
	var deck;

	module("Deck", {
		setup: function() {
			deck = new Deck();
		}
	});

	test("Create a new slide", function() {
		var activeChanged = false;
		deck.on("change:activeSlide", function() {
			activeChanged = true;
		});
		var createdSlide = deck.newSlide();

		equal(1, deck.get("slides").length, "One slide created");
		equal(createdSlide, deck.get("activeSlide"), "New slide is the active slide");
		equal(true, activeChanged, "Got an active slide change notification");
	});

	test("Create several slides", function() {
		var createdSlides = [];

		var activeChangeCnt = 0;
		deck.on("change:activeSlide", function() {
			++activeChangeCnt;
		});

		for (var i = 0; i < 5; ++i) {
			createdSlides.push(deck.newSlide());
		}

		equal(createdSlides.length, activeChangeCnt, 
			"Active slide changed for each new slide created");
		equal(createdSlides[createdSlides.length - 1], deck.get("activeSlide"), 
			"Last created slide is the active slide");

		for (var i = 0; i < createdSlides.length-1; ++i) {
			equal(false, createdSlides[i].get("active"),
				"Previously created slides are not active");
			equal(false, createdSlides[i].get("selected"),
				"Previously created slides are not selected");
		}
	});

	test("Remove the first created slide", function() {
		function commonAsserts() {
			equal(removed, createdSlide, "Created slide and removed slide are equivalent");
			equal(createdSlide.get("active"), false, "Removed slide is no longer active");
			equal(createdSlide.get("selected"), false, "Removed slide is no longer selected");
			equal(removed._callbacks, undefined, "Removed slide has no listeners");
		}

		var createdSlide = deck.newSlide();
		var removed = deck.removeSlide(createdSlide);

		equal(deck.get("slides").length, 0, "No slides left");
		equal(deck.get("activeSlide") == null, true, "No active slide currently exists");
		commonAsserts();

		createdSlide = deck.newSlide();
		var lastSlide = deck.newSlide();
		removed = deck.removeSlide(createdSlide);

		equal(deck.get("slides").length, 1, "One slide left");
		equal(deck.get("activeSlide"), lastSlide, "Active slide is the last slide");
		commonAsserts();
	});

	test("Remove the last created slide", function() {
		var firstSlide = deck.newSlide();
		var createdSlide = deck.newSlide();
		var removed = deck.removeSlide(createdSlide);

		equal(deck.get("slides").length, 1, "One slide left");
		equal(deck.get("activeSlide"), firstSlide, "Active slide is the first slide");
		equal(createdSlide, removed, "Removed slide is the last created slide");
		equal(createdSlide.get("active"), false, "Removed slide is no longer active");
		equal(createdSlide.get("selected"), false, "Removed slide is no longer selected");
		equal(removed._callbacks, undefined, "Removed slide has no listeners");
	});

	test("Remove a slide in the middle", function() {
		var firstSlide = deck.newSlide();
		var secondSlide = deck.newSlide();
		var lastSlide = deck.newSlide();

		var removed = deck.removeSlide(secondSlide);

		equal(deck.get("slides").length, 2, "Two slides left");
		equal(deck.get("activeSlide"), lastSlide, "Active slide is the third slide");
		equal(secondSlide, removed, "Removed slide is the second slide");
		equal(secondSlide.get("active"), false, "Removed slide is no longer active");
		equal(secondSlide.get("selected"), false, "Removed slide is no longer selected");
		equal(removed._callbacks, undefined, "Removed slide has no listeners");
	});

	test("Import a presentation into a deck", function() {
		var importStr = '{"slides":[{"num":0,"components":[{"size":83,"family":"\'Lato\', sans-serif","color":"grey","style":"","weight":"","x":103.34584571018706,"y":33.74230699022573,"scale":{"x":1,"y":1},"type":"TextBox","text":"Text","selected":false}],"z":0,"impScale":1,"rotateX":0,"rotateY":0,"rotateZ":0,"selected":false,"active":false},{"num":1,"components":[],"z":0,"impScale":1,"rotateX":0,"rotateY":0,"rotateZ":0,"selected":true,"active":true},{"num":2,"components":[],"z":0,"impScale":1,"rotateX":0,"rotateY":0,"rotateZ":0,"selected":false,"active":false}],"activeSlide":{"num":1,"components":[],"z":0,"impScale":1,"rotateX":0,"rotateY":0,"rotateZ":0,"selected":true,"active":true},"background":{"options":{"controlPoints":["#F0F0F0 0%","#BEBEBE 100%"],"orientation":"horizontal","type":"linear","fillDirection":"top","generateStyles":true},"points":[{"position":0,"color":"#F0F0F0"},{"position":0.35714285714285715,"color":"#BEBEBE"}],"styles":["linear-gradient(top, #F0F0F0 0%, #BEBEBE 35%)","-webkit-linear-gradient(top, #F0F0F0 0%, #BEBEBE 35%)"]},"fileName":"Gifs"}';
		deck.import(JSON.parse(importStr));

		equal(deck.get("slides").length, 3, "Three slides were imported");
		equal(deck.get("fileName"), "Gifs", "Slideshow remembers its filename");
		equal(deck.get("background").options.orientation, "horizontal", "Imported with horizontal bg");
		equal(deck.get("background").options.type, "linear", "Imported with linear bg");
		equal(deck.get("slides").at(1), deck.get("activeSlide"), "Active slide is the second slide");
	});

	test("Undo/Redo - Slide creation", function() {
		var first = deck.newSlide();
		var second = deck.newSlide();

		deck.undo();

		equal(deck.get("slides").length, 1, "One slide left");
		equal(first, deck.get("activeSlide"), "First slide is active");

		deck.redo();

		equal(deck.get("slides").length, 2, "Both slides exist");
		equal(second, deck.get("activeSlide"), "Second is active");
	});

	test("Undo/Redo - Slide removal", function() {
		var first = deck.newSlide();
		var second = deck.newSlide();

		deck.removeSlide(second);

		deck.undo();

		equal(deck.get("slides").length, 2, "Both slides remain");
		equal(deck.get("activeSlide"), second, "Second slide is active");

		deck.redo();

		equal(deck.get("slides").length, 1, "One slide left");
		equal(deck.get("activeSlide"), first, "First slide is active");
	});

	// test("Undo - Redo - Mishmash", function() {

	// });
});