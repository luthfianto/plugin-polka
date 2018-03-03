"use strict";

const { typeCheck } = require("type-check");
const Router = require("polka")
// console.log(Router)
// console.log(Router())
const getfn = require("./getfn");
const async = require("merapi/async");

const createRouter = async(function* (injector, routes, routerOptions) {
    const getFn = getfn(injector);
    const router = Router(routerOptions);
    // console.log("console.log(routes): " + routes)

    if (typeCheck("Array", routes)) {
        for (const route of routes) {
            if (typeCheck("String", route)) {
                router.use(yield getFn(route));
            } else if (typeCheck("Object", route)) {
                router.use("/", yield createRouter(injector, route, routerOptions));
            }
        }

        return router;
    }

    if (typeCheck("Object", routes)) {
        for (const i in routes) {
            const [verb, path] = i.split(/\s+/);
            const route = routes[i];
            switch (verb) {
                case "GET":
                case "POST":
                case "PUT":
                case "DELETE":
                    if (path) {
                        if (typeCheck("String", route)) {
                            router[verb.toLowerCase()](path, yield getFn(route));
                        } else
                            router[verb.toLowerCase()](path, yield createRouter(injector, route, routerOptions));
                    } else {
                        if (typeCheck("String", route))
                            router[verb.toLowerCase()]("/", yield getFn(route));
                        else
                            router[verb.toLowerCase()]("/", yield createRouter(injector, route, routerOptions));
                    }
                    break;
                default:
                    if (typeCheck("String", route))
                        router.use(verb, yield getFn(route));
                    else {
                        const routeFunc = yield createRouter(injector, route, routerOptions);
                        router.use(verb, function (req, res, next) {
                            req.args = Object.assign({}, req.params, req.args);
                            routeFunc(req, res, next);
                        });
                    }
            }
        }
        return router;
    }

    if (typeCheck("String", routes)) {
        router.use(yield getFn(routes));
    }

    return router;
});

module.exports = createRouter;