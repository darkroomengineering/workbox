importScripts('/node_modules/mocha/mocha.js');
importScripts('/node_modules/chai/chai.js');
importScripts('/node_modules/sw-testing-helpers/build/browser/mocha-utils.js');

importScripts('/packages/sw-lib/build/sw-lib.min.js');

/* global goog */

const expect = self.chai.expect;
self.chai.should();
mocha.setup({
  ui: 'bdd',
  reporter: null,
});

describe('Test swlib.router', function() {
  it('should be accessible goog.swlib.router', function() {
    expect(goog.swlib.router).to.exist;
  });

  const badInput = [
    {
      capture: null,
      errorName: 'unsupported-route-type',
    },
    {
      capture: 123,
      errorName: 'unsupported-route-type',
    },
    {
      capture: true,
      errorName: 'unsupported-route-type',
    },
    {
      capture: false,
      errorName: 'unsupported-route-type',
    },
    {
      capture: {},
      errorName: 'unsupported-route-type',
    },
    {
      capture: [],
      errorName: 'unsupported-route-type',
    },
    {
      capture: '',
      errorName: 'empty-express-string',
    },
  ];
  badInput.forEach((badInput) => {
    it(`should throw on adding invalid route: '${badInput}'`, function() {
      let thrownError = null;
      try {
        goog.swlib.router.registerRoute(badInput.capture, () => {});
      } catch (err) {
        thrownError = err;
      }

      expect(thrownError).to.exist;
      if (thrownError.name !== badInput.errorName) {
        console.error(thrownError);
        throw new Error(`Expected thrownError.name to equal '${badInput.errorName}'`);
      }
    });
  });

  it('should be able to register a valid express route', function() {
    const date = Date.now();
    const fakeID = '1234567890';
    const expressRoute = `/:date/:id/test/`;
    const exampleRoute = `/${date}/${fakeID}/test/`;

    return new Promise((resolve, reject) => {
      goog.swlib.router.registerRoute(expressRoute, (args) => {
        (args.event instanceof FetchEvent).should.equal(true);
        args.url.toString().should.equal(new URL(exampleRoute, location).toString());
        args.params[0].should.equal(exampleRoute);
        args.params[1].should.equal(date.toString());
        args.params[2].should.equal(fakeID);

        resolve();
      });
      const fetchEvent = new FetchEvent('fetch', {
        request: new Request(self.location.origin + exampleRoute),
      });

      self.dispatchEvent(fetchEvent);
    });
  });

  it('should be able to register a valid regex route', function() {
    const capturingGroup = 'test';
    const regexRoute = /\/1234567890\/(\w+)\//;
    const exampleRoute = `/1234567890/${capturingGroup}/`;

    return new Promise((resolve, reject) => {
      goog.swlib.router.registerRoute(regexRoute, (args) => {
        (args.event instanceof FetchEvent).should.equal(true);
        args.url.toString().should.equal(new URL(exampleRoute, location).toString());
        args.params[0].should.equal(exampleRoute);
        args.params[1].should.equal(capturingGroup);

        resolve();
      });
      const fetchEvent = new FetchEvent('fetch', {
        request: new Request(self.location.origin + exampleRoute),
      });

      self.dispatchEvent(fetchEvent);
    });
  });

  it('should be able to register a valid Route instance route', function() {
    const exampleRoute = `/1234567890/test/`;

    return new Promise((resolve, reject) => {
      const routeInstance = new goog.swlib.Route({
        match: (url) => true,
        handler: {
          handle: (args) => {
            (args.event instanceof FetchEvent).should.equal(true);
            args.url.toString().should.equal(new URL(exampleRoute, location).toString());

            resolve();
          },
        },
      });

      goog.swlib.router.registerRoute(routeInstance);
      const fetchEvent = new FetchEvent('fetch', {
        request: new Request(self.location.origin + exampleRoute),
      });

      self.dispatchEvent(fetchEvent);
    });
  });
});