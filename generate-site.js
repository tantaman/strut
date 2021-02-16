// Register all partials
// Go through each template
// Find a corresponding data file
// Run handlebars on them.


var handlebars = require('handlebars'),
	fs = require('fs');

// TODO: just make this a grunt trask?
// Would be easier to grab files and even more configurable.

grabPartials('src/templates/partials', function() {
	writeSite('src/templates', 'src/data', '.');
});

function grabPartials(dir, cb) {
	fs.readdir(dir, registerPartials);

	var latch;
	function registerPartials(err, files) {
		latch = countdown(files.length, cb);
		files = files || [];
		files.forEach(function(file) {
			var partialName = stripExtension(file);

			fs.readFile(dir + '/' + file,
				{encoding: 'UTF-8'},
				addParams(registerPartial, partialName));
		});
	}

	function registerPartial(err, content, name) {
		if (!err) {
			console.log('Registered partial ' + name);
			handlebars.registerPartial(name, content);
			latch();
		} else
			throw err;
	}
}

function writeSite(srcDir, dataDir, destDir) {
	fs.readdir(srcDir, processTemplates);

	function processTemplates(err, files) {
		files.forEach(function(file) {
			var templateName = stripExtension(file);
			console.log('Reading template file: ' + srcDir + '/' + file);
			fs.readFile(srcDir + '/' + file,
				{encoding: 'UTF-8'},
				addParams(processTemplate, templateName, destDir));
		});
	}

	function processTemplate(err, contents, templateName, destDir) {
		if (err) {
			return;
		}
		getDataFor(dataDir, templateName, function(data) {
			var generated = handlebars.compile(contents)(data);
			writeFile(generated, destDir + '/' + templateName + '.html');
		});
	}

	function writeFile(content, dest) {
		fs.writeFile(dest, content, function(err) {
			if (err) 
				console.log(err);
		});
	}
}

function getDataFor(dataDir, templateName, cb) {
	fs.readFile(dataDir + '/' + templateName + '.json',
		{encoding: 'UTF-8'}, function(err, data) {
			if (err) console.log(err);
			if (err) data = {};
			else {
				data = JSON.parse(data);
			}
			cb(data);
		});
}

function stripExtension(name) {
	var dot = name.lastIndexOf('.');
	if (dot != -1)
		return name.substring(0, dot);
	return name;
}

function addParams(fn) {
	var additionalParams = Array.prototype.slice.call(arguments, 0);
	additionalParams.shift();
	return function() {
		var params = Array.prototype.slice.call(arguments, 0);
		params = params.concat(additionalParams);
		fn.apply(this, params);
	}
}

function countdown(n, cb) {
    var args = [];
    return function() {
      for (var i = 0; i < arguments.length; ++i)
        args.push(arguments[i]);
      n -= 1;
      if (n == 0)
        cb.apply(this, args);
    }
}
