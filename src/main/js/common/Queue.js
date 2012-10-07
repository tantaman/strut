/**
A basic queue abstraction.

@author Matt Crinklaw
*/
define(function() {
	function Queue() {
		this._queue = [];
	}
	
	Queue.prototype = {
		take: function() {
			if (this._queue.length != 0)
				return this._queue.shift();
			else
				return null;
		},
		
		enqueue: function(item) {
			this._queue.push(item);
		}
	};
	
	function create() {
		return new Queue();
	}
	
	return { create: create };
});