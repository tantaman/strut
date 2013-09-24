/**
The eventEmitter pattern from nodeJS ported to the browser.

@author Matt Crinklaw
*/
define(
function() {
	function EventEmitter() {
		if (!(this instanceof EventEmitter)) return new EventEmitter();
		
		this._events = null;

		if (typeof(process) !== 'undefined' && typeof(process.nextTick) !== 'undefined') {
			this._deferer = function(cb, topic, args) {
				process.nextTick(function() { cb(topic, args); } );
			};
		} else {
			this._deferer = function(cb, topic, args) {
				setTimeout(function () {cb(topic, args); }, 0);
			};
		}
	};

	EventEmitter.prototype = {
		_listeners: function listeners(type) {
			var events = this._events || (this._events = {});
    		return events[type] || (events[type] = []);
		},
		
		_emit: function(topic, args) {	
			if (topic instanceof Array)
				topic = JSON.stringify(topic);
			if (!this._events) return;
			var subs = this._events[topic];
			if (!subs) return;
			
			var len = subs.length;
			while(len--){
				var sub = subs[len];
				// try {
					if (sub)
						sub.cb.apply(sub.context, args);
				// } catch(e) {
				// 	console.log(e.stack);
				// }
			}
		},
		
		_splice: function(args, start, end) {
			args = Array.prototype.slice.call(args);
			return args.splice(start, end);
		},
		
		_indexOfSub: function(arr, cb, context) {
			for (var i = 0; i < arr.length; ++i) {
				if (arr[i].cb === cb && arr[i].context === context)
					return i;
			}
			
			return -1;
		},

		/**
		Publish an event on the given topic
		*/
		emit: function(topic) {
			var args = arguments.length > 1 ? this._splice(arguments, 1, arguments.length) : [];
			this._emit(topic, args);
		},
		
		trigger: function() {
			this.emit.apply(this, arguments);
		},
		
		/**
		Publish an event on the given topic on the next iteration 
		through the event loop
		*/
		emitDeferred: function(topic) {
			var args = arguments.length > 1 ? this._splice(arguments, 1, arguments.length) : [];
			this._deferer(emit, topic, args);
		},

		/**
		Register a callback for the given topic.
		Optionally, a context may be provided.  The provided
		context will be used for the this argument to callback.
		*/
		on: function(topic, callback, context) {
			if (!callback)
				throw "Undefined callback provided";
			if (topic instanceof Array)
				topic = JSON.stringify(topic);
			
			var subs = this._listeners(topic);
			var index = this._indexOfSub(subs, callback, context);
			if (index < 0) {
				subs.push({cb: callback, context: context});
				index = subs.length - 1;
			}

			var self = this;
			return {dispose: function() {
				self.removeListener(topic, callback, context);
			}};
		},
		
		/**
		Register a callback that will be removed after
		its first notification
		*/
		once: function(topic, callback, context) {
			var holder = {sub: null};
			holder.sub = this.on(topic, function() {
				holder.sub.dispose();
				callback.apply(context, arguments);
			});
			
			return holder.sub;
		},

		/**
		remove a listener.  If the listener was registerd
		with a context, a context must be provided for its removal.
		*/
		removeListener: function(topic, callback, context) {
			var subs = this._listeners(topic);
			
			var index = this._indexOfSub(subs, callback, context);
			
		    if (0 <= index)
		      subs.splice(index, 1);
		    
		    if (subs.length == 0)
		    	delete this._events[topic];
		},
		
		getNumListeners: function(topic){
			
			var numListeners = 0;
			
			if (this._events[topic]){
				numListeners = this._events[topic].length;
			}
			
			return numListeners;
		},

		
		off: function(topic, callback, context) {
			this.removeListener(topic, callback, context);
		},
		
		removeAllListeners: function() {
			this._events = null;
		}
	};
	
	return EventEmitter;
});

//try {
//if (exports) {
//exports.EventBus = EventBus;
//}} catch (e) {}
