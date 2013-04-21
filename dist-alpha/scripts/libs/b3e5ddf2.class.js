define(["vendor/extendFunc"], function(extend){
	var initializing = false, fnTest = /xyz/.test(function(){xyz;}) ? /\b_super\b/ : /.*/;

	// The base Class implementation (does nothing)
	// This is making class global...
	this.Class = function() {};
	
	Class.extend = extend;

	return Class;
});

