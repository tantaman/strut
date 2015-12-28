define(['libs/backbone'],
        function (Backbone) {
            'use strict';

            /**
             * @class ComponentButton
             * @augments Backbone.View
             */
            return Backbone.View.extend({
                className: '',
                tagName: 'a',
                /**
                 * Returns list of events, tracked by this view.
                 *
                 * @returns {Object}
                 */
                events: {
                    'click': '_clicked'
                },
                /**
                 * Initialize ComponentButton.
                 */
                initialize: function () {
                    this.$el.attr('data-compType', this.options.componentType);
                },
                /**
                 * React on button click.
                 * @private
                 */
                _clicked: function () {
                    mixpanel.track("ChartBook Button Clicked", {"Name": this.options.icon});
                    this.options.editorModel.addComponent(this.options.componentType);
                },
                /**
                 * Render the button.
                 *
                 * @returns {*}
                 */
                render: function () {
                    this.$el.html('<img alt="' + this.options.icon + '" src="img/UI_icons/' + this.options.icon + '.png"></br>' + this.options.name);
                    return this;
                },
                constructor: function ComponentButton() {
                    Backbone.View.prototype.constructor.apply(this, arguments);
                }
            });
        });