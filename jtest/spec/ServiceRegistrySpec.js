define([
	'framework/ServiceRegistry', 'libs/lodash'
], function(ServiceRegistry, _) {
	'use strict';

	describe('ServiceRegistry', function() {
		var registry = new ServiceRegistry();

		describe('registration', function() {
			describe('shorthand registration', function() {
				it('Allows a single interface per service', function() {
					registry.register('test.interface', {});
				});

				it('Allows multiple interfaces for one service', function() {
					registry.register(['thing1', 'thing2'], {});
				});

				it('Allows multiple services per interface', function() {
					registry.register('test.interface', {});
					registry.register('test.interface', {});
				});
			});

			describe('longhand registration', function() {
				it('Allows everything shorthand registration does', function() {
					registry.register({
						interfaces: 'test.interface'
					}, {});

					registry.register({
						interfaces: ['thing1', 'thing2']
					}, {});

					registry.register({
						interfaces: ['thing1', 'thing2']
					}, {});
				});

				it('Allows metadata to be attached to a service', function() {
					registry.register({
						interfaces: 'particularService',
						meta: {version: '1.0.0'}
					}, {});
				});
			});
		});

		describe('getting a service', function() {
			it('Can be done by a single interface name', function() {
				var service = {};
				registry.register('homer', service);

				expect(registry.getBest('homer')).toEqual(service);
			});

			it('Can be done by multiple interface names', function() {
				var service = {};
				registry.register(['homer', 'simpson'], service);
				expect(registry.get(['homer', 'simpson'])[0].service()).toEqual(service);

				var bad = {};
				registry.register('simpson', bad);
				expect(registry.get(['homer', 'simpson']).length).toEqual(1);

				var entries = registry.get(['simpson', 'homer']);
				expect(entries[0].service()).toEqual(service);
				expect(entries.length).toEqual(1);
			});

			it('Can take metadata to match services against', function() {
				var service = function() {};

				registry.register({
					interfaces: 'thinger',
					meta: {version: '1.0.0'}
				}, service);

				var res = registry.get({
					interfaces: 'thinger',
					meta: {version: '1.0.0'}
				});

				expect(res.length).toEqual(1);
				expect(res[0].service()).toEqual(service);

				res = registry.get({
					interfaces: 'thiner',
					meta: {version: '2'}
				});

				expect(res.length).toEqual(0);

				res = registry.get({
					interfaces: 'thinger'
				});

				expect(res[0].service()).toEqual(service);
			});
		});

		describe('de-registration', function() {

		});

		describe('events', function() {

		});
	});
})