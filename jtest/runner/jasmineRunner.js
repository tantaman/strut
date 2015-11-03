require.config({
    // Ensure you point to where your spec folder is, base directory is app/scripts,
    // which is why ../../test is necessary
    baseUrl : '../app/scripts/',
    paths: {
        jquery : 'libs/jQuery',
        lodash : 'libs/lodash',
        backbone : 'libs/backbone',
        jasmine: '../../jtest/lib/jasmine-2.3.4/jasmine',
        jasmine_html: '../../jtest/lib/jasmine-2.3.4/jasmine-html',
        jasmine_boot: '../../jtest/lib/jasmine-2.3.4/boot',
        multiMap : '../../jtest/spec/MultiMapSpec',
        serviceRegistry : '../../jtest/spec/ServiceRegistrySpec'        
    },
    shim: {
        backbone :{
             deps: ['jquery','lodash']
        },
        jasmine :{
             deps: ['jquery']
        },
        jasmine_html :{
             deps: ['jquery', 'jasmine']
        },
        jasmine_boot :{
             deps: ['jquery', 'jasmine', 'jasmine_html']
        },
        multiMap : {
             deps: ['jasmine', 'jasmine_html', 'jasmine_boot']
        },
        serviceRegistry : {
             deps: ['backbone','jasmine', 'jasmine_html', 'jasmine_boot']
        }
    }
});
require(['jquery', 'lodash', 'backbone','jasmine', 'jasmine_html', 'jasmine_boot', 'multiMap', 'serviceRegistry'], 
function ($, lodash, backbone, jasmine, jasmine_html, jasmine_boot, multiMap, serviceRegistry) {});
