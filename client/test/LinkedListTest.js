var requirejs = require('requirejs');

requirejs.config({
	baseUrl: "../web/scripts",
    nodeRequire: require
});

requirejs(["common/collections/LinkedList"], function(LinkedList) {
	var l = new LinkedList();

	l.push(1).push(2).push(3).push(4);

	l.forEach(function(val) {
		console.log(val);
	});

	l.pop();
	l.pop();

	l.forEach(function(val) {
		console.log(val);
	});
});