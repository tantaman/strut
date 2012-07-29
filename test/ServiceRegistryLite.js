define(['vendor/amd/ServiceRegistryLite'],
function(ServiceRegistry) {
	var registry;
	module('Service Registry Lite', {
		setup: function() {
			registry = new ServiceRegistry();
		}
	});

	// test('Register a service under one interface', function() {
	// 	registry.register("someInterface", {});
	// });

	// test('Register a service under multiple interfaces', function() {
	// 	registry.register(['someInterface', 'someOtherInterface'], {});
	// });

	// test('Register a service under existing interfaces', function() {
	// 	registry.register('someInterface', {});
	// 	register.register('someInterface', {});
	// 	registry.registry(['someOtherInterface', 'someInterface'], {});
	// });

	test('Get a service via one interface', function() {
		var expected = {};
		registry.register('someInterface', expected);
		var service = registry.get('someInterface');

		equal(service, expected, "The registered service is the returned service");
	});

	test('Get a service via multiple interfaces', function() {
		var expected = {};
		registry.register(['someInterface', 'someOtherInterface'], expected);
		var service = registry.get(['someInterface', 'someOtherInterface']);

		equal(service, expected, "The registered service is the returned service");
	});

	test('Get multiple services for an interface', function() {
		var expected1 = {};
		var expected2 = {};

		registry.register(['someInterface', 'someOtherInterface'], expected1);
		registry.register(['someInterface', 'someOtherInterface'], expected2);

		var services = registry.getAll('someInterface');

		equal(services.length, 2);
		equal(services[0], expected1);
		equal(services[1], expected2);

		services = registry.getAll(['someInterface', 'someOtherInterface']);

		equal(services.length, 2);
		equal(services[0], expected1);
		equal(services[1], expected2);
	});
});