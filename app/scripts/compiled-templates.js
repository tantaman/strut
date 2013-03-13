define(['handlebars'], function(Handlebars) {

this["JST"] = this["JST"] || {};

this["JST"]["bundles/etch_extension/templates/align"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; data = data || {};
  var buffer = "", stack1, functionType="function", escapeExpression=this.escapeExpression;


  buffer += "<a href=\"#\" \n	class=\"btn btn-small etch-";
  if (stack1 = helpers.button) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.button; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\" title=\"";
  if (stack1 = helpers.title) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.title; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\"><i class=\"icon-align-";
  if (stack1 = helpers.icon) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.icon; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\"></i></a>";
  return buffer;
  });

this["JST"]["bundles/etch_extension/templates/colorChooser"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; data = data || {};
  var buffer = "", stack1, functionType="function", escapeExpression=this.escapeExpression;


  buffer += "<div class=\"color-chooser etch-";
  if (stack1 = helpers.button) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.button; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\"><div></div></div>";
  return buffer;
  });

this["JST"]["bundles/etch_extension/templates/defaultButton"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; data = data || {};
  var buffer = "", stack1, functionType="function", escapeExpression=this.escapeExpression;


  buffer += "<a href=\"#\" \n	class=\"btn btn-small etch-";
  if (stack1 = helpers.button) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.button; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\" title=\"";
  if (stack1 = helpers.title) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.title; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\"><span>";
  if (stack1 = helpers.display) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.display; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</span></a>";
  return buffer;
  });

this["JST"]["bundles/etch_extension/templates/fontFamilySelection"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; data = data || {};
  


  return "<div class=\"btn-group\">\n	<button class=\"btn btn-inverse dropdown-toggle btn-small fontFamilyBtn\" data-toggle=\"dropdown\" title=\"Choose the font family\"><span class=\"text\">Lato</span><span class=\"caret\"></span></button>\n	<ul class=\"dropdown-menu menuBarOption\" data-option=\"fontFamily\">\n		<li>\n                  <a class=\"lato\" href=\"#\" data-value=\"'Lato', sans-serif\">Lato</a>\n                  <a class=\"ubuntu\" href=\"#\" data-value=\"'Ubuntu', sans-serif\">Ubuntu</a>\n                  <a class=\"abril\" href=\"#\" data-value=\"'Abril Fatface', cursive\">Abril</a>\n                  <a class=\"hammersmith\" href=\"#\" data-value=\"'Hammersmith One', sans-serif\">Hammersmith One</a>\n                  <a class=\"fredoka\" href=\"#\" data-value=\"'Fredoka One', cursive\">Fredoka One</a>\n                  <a class=\"gorditas\" href=\"#\" data-value=\"'Gorditas', cursive\">Gorditas</a>\n                  <a class=\"pressstart\" href=\"#\" data-value=\"'Press Start 2P', cursive\">Press Start 2P</a>\n		</li>\n	</ul>\n</div>";
  });

this["JST"]["bundles/etch_extension/templates/fontSizeSelection"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; data = data || {};
  


  return "<div class=\"btn-group\">\n	<a class=\"btn btn-small btn-inverse dropdown-toggle\" data-toggle=\"dropdown\" title=\"Choose the font size\"><span class=\"text\">72</span>\n		<span class=\"caret\"></span></a>\n	<ul class=\"dropdown-menu menuBarOption\" data-option=\"fontSize\">\n		<li>\n                  <a href=\"#\" data-value=\"144\">144</a>\n                  <a href=\"#\" data-value=\"96\">96</a>\n                  <a href=\"#\" data-value=\"72\">72</a>\n			<a href=\"#\" data-value=\"64\">64</a>\n                  <a href=\"#\" data-value=\"48\">48</a>\n                  <a href=\"#\" data-value=\"36\">36</a>\n                  <a href=\"#\" data-value=\"24\">24</a>\n                  <a href=\"#\" data-value=\"16\">16</a>\n                  <a href=\"#\" data-value=\"12\">12</a>\n                  <a href=\"#\" data-value=\"8\">8</a>\n		</li>\n     	</ul>\n</div>";
  });

this["JST"]["bundles/header/templates/Header"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; data = data || {};
  


  return "<div class=\"navbar navbar-inverse span12\">\n	<div class=\"navbar-inner\">\n		<ul class=\"nav\">\n			<li class=\"logo-holder\">\n			</li>\n			<li class=\"divider-vertical\">\n			</li>\n		</ul>\n		<ul class=\"nav\" style=\"margin-left: 5%\">\n			<li class=\"create-comp-buttons\">\n				<div class=\"btn-group iconBtns\">\n				</div>\n			</li>\n		</ul>\n		<ul class=\"nav pull-right\">\n			<li class=\"divider-vertical\">\n			</li>\n			<li class=\"mode-buttons\">\n			</li>\n		</ul>\n	</div>\n</div>";
  });

this["JST"]["bundles/logo_button/templates/Logo"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; data = data || {};
  


  return "<a class=\"logo btn dropdown-toggle\" data-toggle=\"dropdown\">\n    <span class=\"caret\"></span>\n</a>\n<ul class=\"dropdown-menu\">\n</ul>";
  });

this["JST"]["bundles/presentation_generator/templates/Button"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; data = data || {};
  var buffer = "", stack1, options, functionType="function", escapeExpression=this.escapeExpression, self=this, blockHelperMissing=helpers.blockHelperMissing;

function program1(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n    <li data-option=\"";
  if (stack1 = helpers.id) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.id; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\">";
  if (stack1 = helpers.name) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.name; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</li>\n    ";
  return buffer;
  }

  buffer += "<button class=\"btn btn-success\"><i class=\"icon-play icon-white\"/>Present</button>\n  <button class=\"btn dropdown-toggle btn-success iconBtnsSplit\" data-toggle=\"dropdown\">\n  <span class=\"caret whiteCaret\"></span>\n</button>\n<ul class=\"dropdown-menu\">\n	";
  options = {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data};
  if (stack1 = helpers.generators) { stack1 = stack1.call(depth0, options); }
  else { stack1 = depth0.generators; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  if (!helpers.generators) { stack1 = blockHelperMissing.call(depth0, stack1, options); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n</ul>";
  return buffer;
  });

this["JST"]["bundles/slide_components/templates/Component"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; data = data || {};
  var buffer = "", stack1, functionType="function", escapeExpression=this.escapeExpression;


  buffer += "<div class=\"content-scale\">\n<div class=\"content\"></div>\n</div>\n<span class=\"topLabel label skewx\" data-delta=\"skewX\">↔</span>\n<span class=\"leftLabel label skewy\" data-delta=\"skewY\">↔</span>\n<span class=\"rightLabel label rotate\" data-delta=\"rotate\">↻</span>\n<span class=\"scale label\" data-delta=\"scale\">↔</span>\n<span class=\"close-btn-red-20 removeBtn\" title=\"Remove\"></span>\n<div class=\"positioningCtrls form-inline\">\n	<span class=\"label leftposition\">→</span>\n	<input class=\"position\" type=\"text\" data-option=\"x\" value=\"";
  if (stack1 = helpers['x']) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0['x']; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\"/>\n	<span class=\"label bottomposition\">↑</span>\n	<input class=\"position\" type=\"text\" data-option=\"y\" value=\"";
  if (stack1 = helpers['y']) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0['y']; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\"/>\n</div>\n";
  return buffer;
  });

this["JST"]["bundles/slide_editor/templates/Button"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; data = data || {};
  


  return "<div class=\"btn-group iconBtns\">\n	<a class=\"btn\">\n		<i class=\"icon-th-list\"></i>\n		Slides\n	</a>\n</div>";
  });

this["JST"]["bundles/slide_snapshot/templates/SlideSnapshot"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; data = data || {};
  


  return "<canvas></canvas>\n<span class=\"close-btn-red-20 removeBtn\" title=\"Remove\"></span>\n<span class=\"badge badge-inverse\"></span>";
  });

this["JST"]["bundles/splash/templates/Splash"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; data = data || {};
  


  return "<div></div>";
  });

this["JST"]["bundles/storage/templates/ProviderTab"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; data = data || {};
  


  return "<div></div>";
  });

this["JST"]["bundles/storage/templates/StorageModal"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; data = data || {};
  var buffer = "", stack1, options, functionType="function", escapeExpression=this.escapeExpression, self=this, blockHelperMissing=helpers.blockHelperMissing;

function program1(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n		";
  if (stack1 = helpers.name) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.name; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + " - ";
  if (stack1 = helpers.id) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.id; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\n	";
  return buffer;
  }

  buffer += "<div class=\"modal-header\">\n	<button class=\"close\" data-dismiss=\"modal\">×</button>\n	<h3>";
  if (stack1 = helpers.title) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.title; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</h3>\n</div>\n<div class=\"modal-body\" style=\"overflow: hidden\">\n	";
  options = {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data};
  if (stack1 = helpers.tabs) { stack1 = stack1.call(depth0, options); }
  else { stack1 = depth0.tabs; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  if (!helpers.tabs) { stack1 = blockHelperMissing.call(depth0, stack1, options); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n</div>\n<div class=\"modal-footer\">\n	<a href=\"#\" class=\"btn btn-primary ok btn-inverse\">Ok</a>\n</div>";
  return buffer;
  });

this["JST"]["bundles/transition_editor/templates/Button"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; data = data || {};
  


  return "<div class=\"btn-group iconBtns\">\n	<a class=\"btn\">\n		<i class=\"icon-th-large\"></i>\n		Overview\n	</a>\n</div>";
  });

this["JST"]["bundles/widgets/templates/ItemImportModal"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; data = data || {};
  var buffer = "", stack1, options, functionType="function", escapeExpression=this.escapeExpression, self=this, blockHelperMissing=helpers.blockHelperMissing;

function program1(depth0,data) {
  
  
  return "<div data-option=\"browse\" class=\"btn\">Browse</div>";
  }

  buffer += "<div class=\"modal-header\">\n	<button class=\"close\" data-dismiss=\"modal\">×</button>\n	<h3>";
  if (stack1 = helpers.title) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.title; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</h3>\n</div>\n<div class=\"modal-body\" style=\"overflow: hidden\">\n	<div class=\"alert alert-error dispNone\">\n  		<button class=\"close\" data-dismiss=\"alert\">×</button>\n  		The image URL you entered appears to be incorrect\n	</div>\n	<h4>URL:</h4><div class=\"form-inline\"><input type=\"text\" name=\"itemUrl\"></input>&nbsp;";
  options = {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data};
  if (stack1 = helpers.browsable) { stack1 = stack1.call(depth0, options); }
  else { stack1 = depth0.browsable; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  if (!helpers.browsable) { stack1 = blockHelperMissing.call(depth0, stack1, options); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "</div>\n	<input type=\"file\" style=\"display:none\"></input>\n	<h4>Preview:</h4>\n	<ul class=\"thumbnails\">\n		<li class=\"span4\">\n			<div class=\"thumbnail\">\n				<";
  if (stack1 = helpers.tag) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.tag; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + " class=\"preview\" width=\"360\" height\"268\"></";
  if (stack1 = helpers.tag) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.tag; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + ">\n			</div>\n		</li>\n	</ul>\n</div>\n<div class=\"modal-footer\">\n	<a href=\"#\" class=\"btn btn-primary ok btn-inverse\">";
  if (stack1 = helpers.title) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.title; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</a>\n</div>";
  return buffer;
  });

return this["JST"];

});