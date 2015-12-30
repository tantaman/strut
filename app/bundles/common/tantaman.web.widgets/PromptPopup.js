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
                    $(".storageModal").find(".ok").removeClass("inactive");
                },
                render: function (action, handler, id, storageProvider) {
                    this.action = action;
                    this.handler = handler;
                    this.id = id;
                    this.storageProvider = storageProvider;
                    this.$el.html(this.template({
                        title: this.action
                    }));
                },
                _okClicked: function () {
                    this.handler(this.id, this._response, this.storageProvider);
                    this.$el.find(".ok").addClass("inactive");
                },
                _response: function(resp, err){
                    $(".promptPopup").find("h4").addClass("hide");
                    
                    if(err){
                        $(".promptPopup").find(".warning").removeClass("hide").html(resp);
                    }
                    else{
                        $(".promptPopup").find(".success").removeClass("hide").html(resp);
                    }    
                    setTimeout(function(){ 
                        $(".promptPopup").addClass("hide");
                        $(".promptPopup").find(".ok").removeClass("inactive");
                        $(".storageModal").find(".ok").removeClass("inactive");
                    }, 3000);
                }
            });
        });