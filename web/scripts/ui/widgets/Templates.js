
		define(["vendor/amd/Handlebars"], function(Handlebars) {
			return {
		
"BackgroundPicker": Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  helpers = helpers || Handlebars.helpers;
  var foundHelper, self=this;


  return "<div class=\"modal-header\">\n	<button class=\"close\" data-dismiss=\"modal\">×</button>\n	<h3>Change Background</h3>\n</div>\n<div class=\"modal-body\">\n	<div class=\"pull-left\">\n		<div><h4>Gradient</h4></div>\n		<div class=\"gradientPicker\">\n		</div>\n		<div class=\"gradientOptions\">\n			<div class=\"btn-group\">\n	  			<button class=\"btn\">Type</button>\n	  			<button class=\"btn dropdown-toggle\" data-toggle=\"dropdown\">\n	    			<span class=\"caret\"></span>\n	  			</button>\n	  			<ul class=\"dropdown-menu\" data-option=\"type\">\n	    			<li><a href=\"#\" data-value=\"linear\">Linear</a></li>\n	    			<li><a href=\"#\" data-value=\"radial\">Radial</a></li>\n	  			</ul>\n			</div>\n			<div class=\"btn-group\">\n	  			<button class=\"btn\">Direction</button>\n	  			<button class=\"btn dropdown-toggle\" data-toggle=\"dropdown\">\n	    			<span class=\"caret\"></span>\n	  			</button>\n	  			<ul class=\"dropdown-menu\" data-option=\"direction\">\n	    			<li><a href=\"#\" data-value=\"top\">Top</a></li>\n	    			<li><a href=\"#\" data-value=\"left\">Left</a></li>\n	    			<li><a href=\"#\" data-value=\"15deg\">15&deg;</a></li>\n	    			<li><a href=\"#\" data-value=\"30deg\">30&deg;</a></li>\n	    			<li><a href=\"#\" data-value=\"45deg\">45&deg;</a></li>\n	    			<li><a href=\"#\" data-value=\"105deg\">105&deg;</a></li>\n	    			<li><a href=\"#\" data-value=\"120deg\">120&deg;</a></li>\n	    			<li><a href=\"#\" data-value=\"135deg\">135&deg;</a></li>\n	  			</ul>\n			</div>\n		</div>\n	</div>\n	<div class=\"pull-left bgPreview\">\n		<div><h4>Background Preview</h4></div>\n		<div class=\"gradientPreview\">\n		</div>\n	</div>\n	<div style=\"clear: both\"></div>\n</div>\n<div class=\"modal-footer\">\n	<a href=\"#\" class=\"btn btn-inverse ok\">OK</a>\n	<a href=\"#\" class=\"btn\" data-dismiss=\"modal\">Cancel</a>\n</div>";}

),
"ItemGrabber": Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  helpers = helpers || Handlebars.helpers;
  var buffer = "", stack1, foundHelper, self=this, functionType="function", helperMissing=helpers.helperMissing, undef=void 0, escapeExpression=this.escapeExpression;


  buffer += "<div class=\"modal-header\">\n	<button class=\"close\" data-dismiss=\"modal\">×</button>\n	<h3>";
  foundHelper = helpers.title;
  stack1 = foundHelper || depth0.title;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "title", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</h3>\n</div>\n<div class=\"modal-body\">\n	<div class=\"alert alert-error disp-none\">\n  		<button class=\"close\" data-dismiss=\"alert\">×</button>\n  		The image URL you entered appears to be incorrect\n	</div>\n	<h4>URL:</h4><input type=\"text\" name=\"itemUrl\"></input>\n	<h4>Preview:</h4>\n	<ul class=\"thumbnails\">\n		<li class=\"span4\">\n			<div class=\"thumbnail\">\n				<";
  foundHelper = helpers.tag;
  stack1 = foundHelper || depth0.tag;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "tag", { hash: {} }); }
  buffer += escapeExpression(stack1) + " class=\"preview\" width=\"360\" height\"268\"></";
  foundHelper = helpers.tag;
  stack1 = foundHelper || depth0.tag;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "tag", { hash: {} }); }
  buffer += escapeExpression(stack1) + ">\n			</div>\n		</li>\n	</ul>\n</div>\n<div class=\"modal-footer\">\n	<a href=\"#\" class=\"btn btn-primary ok btn-inverse\">";
  foundHelper = helpers.title;
  stack1 = foundHelper || depth0.title;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "title", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</a>\n</div>";
  return buffer;}

),
"OpenDialog": Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  helpers = helpers || Handlebars.helpers;
  var buffer = "", stack1, stack2, foundHelper, tmp1, self=this, functionType="function", helperMissing=helpers.helperMissing, undef=void 0, escapeExpression=this.escapeExpression;

function program1(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n			<li><a href=\"#\"><span>";
  stack1 = depth0;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, ".", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</span><button class=\"close\">x</button></a></li>\n		";
  return buffer;}

  buffer += "<div class=\"modal-header\">\n	<button class=\"close\" data-dismiss=\"modal\">×</button>\n	<h3>Open</h3>\n</div>\n<div class=\"modal-body\">\n	<ul class=\"nav nav-list\">\n		";
  foundHelper = helpers.fileNames;
  stack1 = foundHelper || depth0.fileNames;
  stack2 = helpers.each;
  tmp1 = self.program(1, program1, data);
  tmp1.hash = {};
  tmp1.fn = tmp1;
  tmp1.inverse = self.noop;
  stack1 = stack2.call(depth0, stack1, tmp1);
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n	</ul>\n</div>\n<div class=\"modal-footer\">\n	<a href=\"#\" class=\"btn btn-inverse ok\">OK</a>\n	<a href=\"#\" class=\"btn\" data-dismiss=\"modal\">Cancel</a>\n</div>";
  return buffer;}

),
"RawTextImporter": Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  helpers = helpers || Handlebars.helpers;
  var foundHelper, self=this;


  return "<div class=\"modal-header\">\n	<button class=\"close\" data-dismiss=\"modal\">×</button>\n	<h3>Import/Export Show (from/to JSON)</h3>\n</div>\n<div class=\"modal-body\">\n	<h4>JSON string</h4>\n	<textarea style=\"width: 100%; height: 100%\" rows=\"10\"></textarea>\n</div>\n<div class=\"modal-footer\">\n	<a href=\"#\" class=\"btn btn-inverse ok\">OK</a>\n</div>";}

),
"SaveAsDialog": Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  helpers = helpers || Handlebars.helpers;
  var buffer = "", stack1, stack2, foundHelper, tmp1, self=this, functionType="function", helperMissing=helpers.helperMissing, undef=void 0, escapeExpression=this.escapeExpression;

function program1(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n					<li><a href=\"#\"><span>";
  stack1 = depth0;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, ".", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</span><button class=\"close\">x</button></a></li>\n				";
  return buffer;}

function program3(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n					<li><a href=\"#\"><span>";
  stack1 = depth0;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, ".", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</span><button class=\"close\">x</button></a></li>\n				";
  return buffer;}

  buffer += "<div class=\"modal-header\">\n	<button class=\"close\" data-dismiss=\"modal\">×</button>\n	<h3>Save as...</h3>\n</div>\n<div class=\"modal-body\">\n	<!-- <ul class=\"nav nav-tabs\">\n  		<li class=\"active\"><a href=\"#saveLocalTab\">Local</a></li>\n  		<li><a href=\"#saveRemoteTab\">Remote</a></li>\n	</ul> -->\n\n	<!-- <div class=\"tab-content\">\n  		<div class=\"tab-pane active\" id=\"saveLocalTab\"> -->\n		  	<h4>Name</h4>\n			<input type=\"text\"></input>\n			<ul class=\"nav nav-list\">\n				";
  foundHelper = helpers.fileNames;
  stack1 = foundHelper || depth0.fileNames;
  stack2 = helpers.each;
  tmp1 = self.program(1, program1, data);
  tmp1.hash = {};
  tmp1.fn = tmp1;
  tmp1.inverse = self.noop;
  stack1 = stack2.call(depth0, stack1, tmp1);
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n			</ul>\n  		<!-- </div>\n  		<div class=\"tab-pane\" id=\"saveRemoteTab\">\n  			<h4>Name</h4>\n			<input type=\"text\"></input>\n			<ul class=\"nav nav-list\">\n				";
  foundHelper = helpers.fileNames;
  stack1 = foundHelper || depth0.fileNames;
  stack2 = helpers.each;
  tmp1 = self.program(3, program3, data);
  tmp1.hash = {};
  tmp1.fn = tmp1;
  tmp1.inverse = self.noop;
  stack1 = stack2.call(depth0, stack1, tmp1);
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n			</ul>\n  		</div>\n	</div> -->\n</div>\n<div class=\"modal-footer\">\n	<a href=\"#\" class=\"btn btn-inverse ok\">OK</a>\n	<a href=\"#\" class=\"btn\" data-dismiss=\"modal\">Cancel</a>\n</div>";
  return buffer;}

)
}});