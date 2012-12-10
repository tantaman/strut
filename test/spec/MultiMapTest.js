define([
  '../../app/scripts/common/collections/MultiMap'
], function(MultiMap) {
  'use strict';

  describe('MultiMap', function() {
    var map = new MultiMap();
    it('Allows puts', function() {
      map.put('key1', 1);
      map.put('key1', 0);
      map.put('second', 2);
    });

    it('Allows putAlls', function() {
      map.putAll('key1', [2,3,4,5]);
      map.putAll('cookies', ['oreo', 'peanut', 'sugar'])
    });

    it('Allows gets', function() {
      expect(map.get('key1')).to.deep.equal([1,0,2,3,4,5]);
      expect(map.get('second')).to.deep.equal([2]);
    });

    it('Returns an array of values or emptry array on get', function() {
      expect(map.get('key2')).to.deep.equal([]);
      expect(map.get('second')).to.be.instanceof(Array);
    });

    it('Allows multiple values to associate to a single key', function() {
      expect(map.get('key1')).to.deep.equal([1,0,2,3,4,5]);
    });

    it('Allows the removal of all values under a given key', function() {
      map.removeAll('key1');
      expect(map.get('key1')).to.deep.equal([]);
    });

    it('Removes the key when all its values are removed', function() {
      map.remove('second', 2);
      expect(map.get('second')).to.deep.equal([]);
    });

    it('Allows the removal of single values under a given key', function() {
      map.remove('cookies', 'peanut');
      expect(map.get('cookies')).to.deep.equal(['oreo', 'sugar']);
    });

    it('Allows null and undefined values', function() {
      map.put('some', null);
      expect(map.get('some')).to.deep.equal([null]);
      map.put('some', undefined);
      expect(map.get('some')).to.deep.equal([null, undefined]);
    });

    it('Will allow duplicate values', function() {
      map.put('foo', 'bar');
      map.put('foo', 'bar');

      expect(map.get('foo')).to.deep.equal(['bar', 'bar']);
    });

    it('Provides putIfAbsent to allow for distinct values under a key', function() {
      map.put('foo', 'baz');
      map.putIfAbsent('foo', 'baz');

      expect(map.get('foo')).to.deep.equal(['bar', 'bar', 'baz']);
    });
  });

  // describe("module", function() {
  //   it("has trigger method", function() {
  //     expect(MultiMap.trigger).to.be.a("function")
  //   });
  // });

  // describe("one tautology", function() {
  //   it("is a tautology", function() {
  //     expect(true).to.be.true;
  //   });

  //   describe("is awesome", function() {
  //     it("is awesome", function() {
  //       expect(1).to.equal(1);
  //     });
  //   });
  // });

  // describe("simple tests", function() {
  //   it("increments", function() {
  //     var mike = 0;

  //     expect(mike++ === 0).to.be.true;
  //     expect(mike === 1).to.be.true;
  //   });

  //   it("increments (improved)", function() {
  //     var mike = 0;

  //     expect(mike++).to.equal(0);
  //     expect(mike).to.equal(1);
  //   });
  // });

  // describe("setUp/tearDown", function() {
  //   beforeEach(function() {
  //     // console.log("Before");
  //   });

  //   afterEach(function() {
  //     // console.log("After");
  //   });

  //   it("example", function() {
  //     // console.log("During");
  //   });

  //   describe("setUp/tearDown", function() {
  //     beforeEach(function() {
  //       // console.log("Before2");
  //     });

  //     afterEach(function() {
  //       // console.log("After2");
  //     });

  //     it("example", function() {
  //       // console.log("During Nested");
  //     });
  //   });
  // });

  // describe("async", function() {
  //   it("multiple async", function(done) {
  //     var semaphore = 2;

  //     setTimeout(function() {
  //       expect(true).to.be.true;
  //       semaphore--;
  //     }, 500);

  //     setTimeout(function() {
  //       expect(true).to.be.true;
  //       semaphore--;
  //     }, 500);

  //     setTimeout(function() {
  //       expect(semaphore).to.equal(0);
  //       done();
  //     }, 600);
  //   });
  // });
});
