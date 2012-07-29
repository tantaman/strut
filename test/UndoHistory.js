define(["model/common_application/UndoHistory"],
function(UndoHistory) {
	var undoHistory;
	var list;

	var id;
	function AddCmd() {
		this.id = id++;
	}

	AddCmd.prototype = {
		do: function() {
			list.push(this.id);
		},

		undo: function() {
			var returned = list.pop();
			equal(returned, this.id, 'What I pop is what I put');
		}
	};

	function RemoveCmd() {}
	RemoveCmd.prototype = {
		do: function() {
			this.id = list.pop();
		},

		undo: function() {
			list.push(this.id);
		}
	};

	module("UndoHistory", {
		setup: function() {
			undoHistory = new UndoHistory(20);
			list = [];
			id = 0;
		}
	});

	test('Linear undo-redo', function() {
		var add = new AddCmd();
		add.do();
		equal(list.length, 1);

		undoHistory.push(add);
		undoHistory.undo();
		equal(list.length, 0);

		undoHistory.redo();
		equal(list.length, 1);

		var remove = new RemoveCmd();
		remove.do();
		equal(list.length, 0);

		undoHistory.push(remove);
		undoHistory.undo();
		equal(list.length, 1);
		undoHistory.undo();
		equal(list.length, 0);

		undoHistory.redo();
		equal(list.length, 1);
		undoHistory.redo();
		equal(list.length, 0);
	});

	test('Re-do history lost due to new action', function() {
		undoHistory.pushdo(new AddCmd());
		undoHistory.pushdo(new AddCmd());
		undoHistory.pushdo(new AddCmd());

		equal(list.toString(), [0,1,2].toString());

		undoHistory.undo();
		undoHistory.undo();

		equal(list.toString(), [0].toString());

		undoHistory.pushdo(new AddCmd());
		equal(list.toString(), [0,3].toString());
		undoHistory.redo(); // this shouldn't execute anything
		undoHistory.redo(); // this shouldn't execute anything

		equal(list.toString(), [0,3].toString());

		undoHistory.undo();
		equal(list.toString(), [0].toString());
		undoHistory.redo();
		equal(list.toString(), [0,3].toString());
	});

	// test('Gracefully handles excessive undo calls', function() {

	// });

	// test('Gracefully handles excessive redo calls', function() {

	// });

});