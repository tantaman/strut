define(function() {
	var Add, Remove, Move;

	/**
	 * Base command class for simple attribute changing actions.
	 *
	 * @class BaseCommand
	 * @param {*} initial Initial value of component's attribute.
	 * @param {Component} component Affected component.
	 * @param {string} attr Affected component's attribute.
	 * @param {string} name Name of the command (will be shown in undo history and undo/redo hints).
	 */
	function BaseCommand(initial, component, attr, name) {
		this.start = initial;
		this.end = component.get(attr) || 0;
		this.component = component;
		this.name = name;
		this.attr = attr;
	}

	BaseCommand.prototype = {
		"do": function() {
			if (this.component.slide) {
				this.component.slide.set('active', true);
			}
			this.component.set(this.attr, this.end);
			this.component.set('selected', true);
		},
		undo: function() {
			if (this.component.slide) {
				this.component.slide.set('active', true);
			}
			this.component.set(this.attr, this.start);
			this.component.set('selected', true);
		}
	};


	/**
	 * Adds component to the slide.
	 *
	 * @class Add
	 * @param {Slide} slide Target slide.
	 * @param {Component} components Affected component.
	 */
	Add = function(slide, components) {
		this.slide = slide;
		this.components = components.slice(0);
	};

	Add.prototype = {
		"do": function() {
			this.slide.set('active', true);
			this.slide.__doAdd(this.components);
		},
		undo: function() {
			this.slide.set('active', true);
			this.slide.__doRemove(this.components);
		},
		name: "Add Comp"
	};

	/**
	 * Removes component from the slide.
	 *
	 * @class Remove
	 * @param {Slide} slide Target slide.
	 * @param {Component} components Affected component.
	 */
	Remove = function(slide, components) {
		this.slide = slide;
		this.components = components.slice(0);
	};

	Remove.prototype = {
		"do": function() {
			this.slide.set('active', true);
			this.slide.__doRemove(this.components);
		},
		undo: function() {
			this.slide.set('active', true);
			this.slide.__doAdd(this.components);
		},
		name: "Remove Comp"
	};


	/**
	 * Moves component from one location to another.
	 *
	 * @class Move
	 * @param {number} startLoc
	 * @param {Component} component
	 */
	Move = function(startLoc, component) {
		this.startLoc = startLoc;
		this.component = component;
		this.endLoc = {
			x: this.component.get("x"),
			y: this.component.get("y")
		};
		return this;
	};
	Move.prototype = {
		"do": function() {
			if (this.component.slide) {
				this.component.slide.set('active', true);
			}
			this.component.set(this.endLoc);
			this.component.set('selected', true);
		},
		undo: function() {
			if (this.component.slide) {
				this.component.slide.set('active', true);
			}
			this.component.set(this.startLoc);
			this.component.set('selected', true);
		},
		name: "Move"
	};

	return {
		Add: Add,
		Remove: Remove,
		Move: Move,
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