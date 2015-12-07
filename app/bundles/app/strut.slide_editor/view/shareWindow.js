define(['libs/backbone', '../model/shareWindowModel'],
        function (Backbone, model) {
            'use stict';
            return Backbone.View.extend({
                el: "body",
                model: {presentationTitle:"2015 Sales Report : Data Set 2541",
                        mailingList:[
                            {name:"coworker1",email:"coworker1@icharts.net"},
                            {name:"coworker2",email:"coworker2@icharts.net"},
                            {name:"coworker3",email:"coworker3@icharts.net"},
                            {name:"coworker4",email:"coworker4@icharts.net"},
                            {name:"coworker5",email:"coworker5@icharts.net"},
                            {name:"coworker6",email:"coworker6@icharts.net"}
                        ]   
                        },
                template: JST['strut.slide_editor/ShareWindow'],
                render: function () {
                    this.$el.append(this.template(this.model));
                    
                    //console.log(this.$el.append(this.template(this.model)));
                    return this;
                }
             
            });
            
//            var shareWindow = new shareWindowClass();
//            shareWindow.render({model: {presentationTitle:'Miku', mailingList:[] }});

        });