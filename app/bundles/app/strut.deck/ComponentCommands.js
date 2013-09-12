define(function() {
	var Add, Remove, Move, CombinedCommand;

	/**
	 * Base command class for simple attribute changing actions.
	 *
	 * @class BaseCommand
	 * @param {*} initial Initial value of model's attribute.
	 * @param {Component} model Affected model.
	 * @param {String} attr Affected model's attribute.
	 * @param {String} name Name of the command (will be shown in undo history and undo/redo hints).
	 */
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
			this.slide.__doAdd(this.components);
		},
		undo: function() {
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
			this.slide.__doRemove(this.components);
		},
		undo: function() {
			this.slide.__doAdd(this.components);
		},
		name: "Remove Comp"
	};


	/**
	 * Moves component from one location to another.
	 *
	 * @class Move
	 * @param startLoc
	 * @param model
	 */
	Move = function(startLoc, model) {
		this.startLoc = startLoc;
		this.model = model;
		this.endLoc = {
			x: this.model.get("x"),
			y: this.model.get("y")
		};
		return this;
	};
	Move.prototype = {
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

	/**
	 * Special kind of command, which allows to pack several commands into single undo/redo item.
	 *
	 * @class CombinedCommand
	 * @param {(Add|Remove|Move)[]} command
	 * @param {String} name Name of the command (will be shown in undo history and undo/redo hints).
	 */
	CombinedCommand = function(commands, name) {
		this.commands = commands;
		this.name = name;
	};
	CombinedCommand.prototype = {
		"do": function() {
			this.commands.forEach(function(command){
				command.do();
			});
		},
		undo: function() {
			this.commands.forEach(function(command){
				command.undo();
			});
		}
	};

	return {
		CombinedCommand: CombinedCommand,
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