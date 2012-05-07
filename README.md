Showoff
=======

#### GUI / Authoring Tool for ImpressJS ####

This project intends to create an extensible, maintainable, and clean editor for authoring ImpressJS presentations.

Unlike other ImpressJS authoring tools, this one runs entirely on the client side and has a more modular code base.

### Preview ###

A github hosted preview is available at: http://tantaman.github.com/Showoff/client/web/index.html

The preview currently points to the development version of Showoff.

### Building ###

Most of Showoff is written in Coffeescript and uses precompiled templates for HTML rendering.

To compile the CoffeeScript

1. Install CoffeeScript (npm install coffeescript)
2. cd to the root Showoff directory
3. run `rake compileCoffee[w]`  (omit [w] to not watch for changes)

To compile the templates

1. Install Handlebars (npm install handlebars)
2. cd to the root Showoff directory
3. run `rake compileTpls`

### Acknowledgements ###

* ImpreeJS (of course) https://github.com/bartaz/impress.js/
* BackboneJS http://documentcloud.github.com/backbone/
* CoffeeScript http://coffeescript.org/
* RequireJS http://requirejs.org/
* JQuery http://jquery.com/
* Rake http://rubyforge.org/projects/rake/