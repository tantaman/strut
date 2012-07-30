define(["model/presentation/Deck"],
function(Deck) {
	var deck;

	module("Deck", {
		setup: function() {
			//deck = new Deck();
		}
	});

	test("Create a new slide", function() {
		deck = new Deck();
		var activeChanged = false;
		deck.on("change:activeSlide", function() {
			activeChanged = true;
		});
		createdSlide = deck.newSlide();

		equal(1, deck.get("slides").length, "One slide created");
		equal(createdSlide, deck.get("activeSlide"), "New slide is the active slide");
		equal(true, activeChanged, "Got an active slide change notification");
	});

	test("Create several slides", function() {
		deck = new Deck();
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

	// test("Remove the first created slide", function() {

	// });

	// test("Remove the last created slide", function() {

	// });

	// test("Remove a slide in the middle", function() {

	// });

	// test("Import a presentation into a deck", function() {

	// });

	// test("Undo", function() {

	// });

	// test("Redo", function() {

	// });
});