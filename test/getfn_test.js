"use strict";

const { async, Component } = require("merapi");
const merapi = require("merapi");
const getfn = require("../lib/getfn");
const { expect } = require("chai");

describe("getfn", () => {

    let com, fn, fnWithParams;

    beforeEach((async(function* () {
        const container = merapi({
            basepath: __dirname,
            config: {
                name: "test",
                version: "1.0.0",
                main: "com"
            }
        });

        container.register("com", class Com extends Component {
            constructor() { super(); }
            start() { }

            method(req) {
                const y = 0;
                if (req) { const x = req.args; for (const i in x) y += x[i]; }
                return y;
            }

            methodWithArgs(a, b, c, req) {
                return a == 1 && b == 2 && c == 3 && req.args.a == 1;
            }
        });

        container.initialize();

        com = yield container.resolve("com");
        const injector = yield container.resolve("injector");
        const getFn = getfn(injector);
        fn = yield getFn("com.method");
        fnWithParams = yield getFn("com.methodWithArgs(1, 2, 3)");
    })));

    it("should resolve function", () => {
        expect(typeof fn).to.equal("function");
    });

    it("should return the correct function", () => {
        const real = com.method();

        const req = { params: {}, args: {} };
        const expectation = fn(req);

        expect(real).to.equal(expectation);
    });

    it("should return function with merged args and params", () => {
        const real = com.method({ args: { a: 1, b: 2 } });

        const req = { params: { a: 1 }, args: { b: 2 } };
        const expectation = fn(req);

        expect(real).to.equal(expectation);
    });

    it("should return function with bound args", () => {
        const real = com.methodWithArgs(1, 2, 3, { args: { a: 1 } });

        const req = { params: {}, args: { a: 1 } };
        const expectation = fnWithParams(req);

        expect(real).to.equal(expectation);
    });

    it("should throw error if no function found", async(function* () {
        const container = merapi({
            basepath: __dirname,
            config: {
                name: "test",
                version: "1.0.0",
                main: "com"
            }
        });

        container.register("com", class Com extends Component {
            constructor() { super(); }
            start() { }
        });

        container.initialize();

        com = yield container.resolve("com");
        const injector = yield container.resolve("injector");
        const getFn = getfn(injector);

        let e;
        try { fn = yield getFn("com.method"); }
        catch (ex) { e = ex; }

        expect(e).to.be.an("error");
    }));
});