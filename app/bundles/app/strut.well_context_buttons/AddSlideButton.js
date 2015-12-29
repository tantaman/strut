define(['libs/backbone'],
        function (Backbone) {
            return Backbone.View.extend({
                className: 'addBtn button',
                events: {
                    click: "_addSlide"
                },
                _addSlide: function () {
//                  this._editorModel.addSlide(this._wellMenuModel.slideIndex());
                    this._editorModel.addSlide(this._editorModel.activeSlide().collection.length);
                    mixpanel.track("ChartBook Button Clicked", {"Name": "Chart"});
                    mixpanel.people.increment('Number Of Slides', 1);

                },
                render: function () {
                    //this.$el.html('<a><i class="fa fa-plus"></i></br>Slide</a>');
                    this.$el.html('<a><img src="img/UI_icons/add.png" alt="Add Slide"></br>Slide</a>');
                    return this;
                },
                constructor: function AddSlideButton(editorModel, wellMenuModel) {
                    this._editorModel = editorModel;
                    this._wellMenuModel = wellMenuModel;
                    Backbone.View.prototype.constructor.call(this);
                }
            });
        });
