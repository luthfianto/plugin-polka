"use strict";

const merapi = require("merapi");
const { async, Component } = require("merapi");
const request = require("supertest");

/* eslint-env node, mocha */
describe("Merapi Plugin: Polka", () => {
    let port = 10000;

    afterEach(function () {
        port++;
    });

    it("should get route object resolved", async(function* () {
        let routes = {
            "GET /get": "com.get",
            "GET /get-second": {
                "/": "com.get"
            },
            "GET": "com.get",
            "POST": {
                "/": "com.post"
            },
            "/what": "com.get",
            "/get-third": {
                "GET": "com.get"
            }
        };

        let container = merapi({
            basepath: __dirname,
            config: {
                name: "test",
                version: "1.0.0",
                components: { "app": { type: "polka" } },
                main: "com",
                app: { routes, port }
            }
        });

        container.registerPlugin("polka", require("../index.js")(container));
        container.register("com", class Com extends Component {
            constructor() { super(); }
            start() { }
            get(req, res) { res.send(); }
            what(req, res) { res.send(); }
            post(req, res) { res.send(); }
        });

        yield container.initialize();
        let app = yield container.resolve("app");
        // app.start()
        // var serverAddress = require('server-address')
        // var server = serverAddress(app)


        // console.log(app)

        yield request(app).get("/get").expect(200);
        yield request(app).get("/get-second").expect(200);
        yield request(app).get("/").expect(200);
        yield request(app).post("/").expect(200);
        yield request(app).get("/what").expect(200);
        yield request(app).get("/get-third").expect(200);
    }));
});