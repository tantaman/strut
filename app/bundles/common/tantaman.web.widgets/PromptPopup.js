define(['libs/backbone'],
        function (Backbone) {
            return Backbone.View.extend({
                className: "promptPopup modal hide",
                events: {
                    'click .ok': '_okClicked',
                    'click .close': 'clear'
                },
                initialize: function () {
                    this.template = JST['tantaman.web.widgets/PromptPopup'];
                },
                clear: function () {
                    this.$el.addClass("hide");
                },
                render: function (action, handler, id) {
                    this.action = action;
                    this.handler = handler;
                    this.id = id;
                    this.$el.html(this.template({
                        title: this.action
                    }));
                },
                _okClicked: function () {
                    this.handler(this.id, this._response);
                },
                _response: function(resp){
                    $(".promptPopup").find(".modal-body").html(resp);
                    setTimeout(function(){ 
                        $(".promptPopup").addClass("hide");
                    }, 3000);
                }
            });
        });