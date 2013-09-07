define(function() {

	function BaseCommand(initial, model, attr, name) {
		this.start = initial;
		this.end = model.get(attr) || 0;
		this.model = model;
		this.name = name;
		this.attr = attr;
	}

	BaseCommand.prototype = {
		"do": function() {
			this.model.set(this.attr, this.end);
			this.model.set('selected', true);
		},
		undo: function() {
			this.model.set(this.attr, this.start);
			this.model.set('selected', true);
		}
	};


	var AddComponent, RemoveComponent, MoveCommand;

	AddComponent = function(slide, component) {
		this.slide = slide;
		this.component = component;
	};

	AddComponent.prototype = {
		"do": function() {
			this.slide.__doAdd(this.component);
			this.component.set('selected', true);
		},
		undo: function() {
			this.slide.__doRemove(this.component);
		},
		name: "Add Comp"
	};


	RemoveComponent = function(slide, component) {
		this.slide = slide;
		this.component = component;
	};

	RemoveComponent.prototype = {
		"do": function() {
			this.slide.__doRemove(this.component);
		},
		undo: function() {
			this.slide.__doAdd(this.component);
			this.slide.unselectComponents();
			this.component.set('selected', true);
		},
		name: "Remove Comp"
	};

	MoveCommand = function(startLoc, model) {
		this.startLoc = startLoc;
		this.model = model;
		this.endLoc = {
			x: this.model.get("x"),
			y: this.model.get("y")
		};
		return this;
	};
	MoveCommand.prototype = {
		"do": function() {
			this.model.set(this.endLoc);
			this.model.set('selected', true);
		},
		undo: function() {
			this.model.set(this.startLoc);
			this.model.set('selected', true);
		},
		name: "Move"
	};


	return {
		Add: AddComponent,
		Remove: RemoveComponent,
		Move: MoveCommand,
		SkewX: function(initial, component) {
			return new BaseCommand(initial, component, 'skewX', 'Skew X');
		},
		SkewY: function(initial, component) {
			return new BaseCommand(initial, component, 'skewY', 'Skew Y');
		},
		Rotate: function(initial, component) {
			return new BaseCommand(initial, component, 'rotate', 'Rotate');
		},
		Scale: function(initial, component) {
			return new BaseCommand(initial, component, 'scale', 'Scale');
		},
		TextScale: function(initial, component) {
			return new BaseCommand(initial, component, 'size', 'Scale');
		},
		Text: function(initial, component) {
			return new BaseCommand(initial, component, 'text', 'Text');
		}
	};
});