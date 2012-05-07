Showoff
=======

#### GUI / Authoring Tool for ImpressJS ####

This project intends to create an extensible, maintainable, and clean editor for authoring ImpressJS presentations.
I hope this project can also serve as an example of a browser based rich client as the project matures.

Current features:

 * Slide creation
 * Text & image insertion
 * Text and image manipulation (skew, rotate, scale)
 * Fonts and font styles
 * Undo/Redo for some operations
 * Transition configuration
 * ImpreeJS preview generation

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

### Contributing ###

Here is the basic layout of the source:

* Presentation Model: src/coffee/model/presentation
* Editor UI Layer: src/coffee/ui/editor
* Model -> ImpressJS Rendering: src/coffee/ui/impress_renderer

templates for UI components are contained in web/scripts/ui/COMPONENT_NAME/res/templates
in order to package related markup and backing UI (not model) code into modules.

### Acknowledgements ###

* ImpreeJS (of course) https://github.com/bartaz/impress.js/
* BackboneJS http://documentcloud.github.com/backbone/
* CoffeeScript http://coffeescript.org/
* RequireJS http://requirejs.org/
* JQuery http://jquery.com/
* Rake http://rubyforge.org/projects/rake/
* HandlebarsJS http://handlebarsjs.com/
* DustJS http://akdubya.github.com/dustjs/
* Class class http://ejohn.org/blog/simple-javascript-inheritance/