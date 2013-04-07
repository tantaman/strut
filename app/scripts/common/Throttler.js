/**
Throttles an event back to occur at most 1 time in delay ms.

@author Matt Crinklaw
*/
define(['common/Queue'],
function(Queue) {
	/**
	@param integer delay - minimum interval between execution of
	submitted tasks.  Throttler.submit takes various 
	parameters that control what is done with the submitted tasks.
	Submitted tasks can be queued or dropped.
	*/
	function Throttler(delay, context) {
		this._handle = null;
		this._delay = delay;
		this._queue = Queue.create();
		this._context = context;
	}
	
	Throttler.prototype = {
		/**
		Runs the cb after delay if nothing is currently executing.
		
		adds the callback to a queue of infinite length
		if options.rejectionPolicy == queue.
		
		adds the callback to a queue of length 1 if
		options.rejectionPolicy == runLast.  If the queue is filled,
		it replaces the element already in the queue.
		*/
		submit: function(cb, options) {
			if (!this._handle) {
				this._internalSubmit(cb, options);
			} else {
				if (options) {
					this._handleFailedSubmit(cb, options);
				}
			}
		},

		cancel: function() {
			this._queue = Queue.create();
			this._runLast = null;
			if (this._handle != null) {
				clearTimeout(this._handle);
				this._handle = null;
			}
		},
		
		_internalSubmit: function(cb, options) {
			var self = this;
			this._handle = setTimeout(function() {
				if (options && options.arguments)
					cb.apply(self._context, options.arguments)
				else
					cb.call(self._context);
				self._internalCB();
			}, this._delay);
		},
		
		_internalCB: function() {
			var queued = this._queue.take();
			if (queued) {
				this._handle = this._internalSubmit(queued);
			} else if (this._runLast) {
				var runLast = this._runLast;
				this._runLast = null;
				this._internalSubmit(runLast[0], runLast[1]);
			} else {
				this._handle = null;
			}
		},
		
		_handleFailedSubmit: function(cb, options) {
			switch (options.rejectionPolicy) {
			case 'queue':
				this._queue.enqueue(cb);
				break;
			case 'runLast':
				this._runLast = [cb, options];
				break;
			case 'drop':
				break;
			}
		}
	};
	
	return Throttler;
});