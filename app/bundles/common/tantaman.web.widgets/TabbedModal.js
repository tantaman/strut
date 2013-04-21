/*
A modal backed by a ServiceCollection.
Each entry in the collection gets a new tab.
*/
define(['libs/backbone'],
function(Backbone) {
	return Backbone.View.extend({
		events: {
			hidden: '_hidden'
		},

		className: 'tabbedModal modal hide',

		initialize: function() {

		},

		__template: function() {
			return JST['tantaman.web.widgets/TabbedModal'];
		},

		_providerSelected: function(i, e) {
			if (e) {
				var $curr = $(e.currentTarget);
				if (this.$lastProviderTab && this.$lastProviderTab[0] == $curr[0])
					return;
			}

			if (this.$lastProviderTab)
				this.$lastProviderTab.removeClass('active');

			this.$lastProviderTab = $curr;
			this.$lastProviderTab.addClass('active');

			if (this.__currentProvider)
				this.__currentProvider.hide();

			this.__currentProvider = this.__tabCollection[i];

			this.__providerSelected(this.__currentProvider, e);

			this.__currentProvider.show(this.$tabContent, this.$el);
		},

		__providerSelected: function(provider, e) {
		},

		_hidden: function() {
			if (this.__currentProvider)
				this.__currentProvider.hidden();
		},

		show: function(cb, title) {
			this.__cb = cb;
			this.__$title.text(title);
			if (this.__currentProvider)
				this.__currentProvider.show(this.$tabContent, this.$el);
			this.$el.modal('show');
		},

		render: function() {
			this.$el.html(this.__template()(this.__tabCollection));
			this.__$ok = this.$el.find('.ok');
			this.__$title = this.$el.find('.title');
			this.$tabContent = this.$el.find('.tabContent');

			var self = this;
			var $tabs = this.$el.find('.providerTab');
			$tabs.each(function(i) {
				var $item = $(this);
				$item.click(function(e) {
					self._providerSelected(i, e);
				});
			});

			if (this.__tabCollection.length > 0)
				self._providerSelected(0, {currentTarget: $tabs[0]});

			return this;
		},

		// TODO: listen for tab additions and removals.
		// tabProviders should just be a "tabProvider" that can be listened to
		// and provides tabs.
		constructor: function TabbedModal(tabCollection) {
			this.__tabCollection = tabCollection;
			Backbone.View.prototype.constructor.call(this);
		}
	});
});