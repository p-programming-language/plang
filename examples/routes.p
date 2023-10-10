use writeln from @std/io
use Server from @http

interface Route {
    string name;
    string path;
    string response;
}

any server = new Server

Route[] routes = []

void fn registerRoute(string name, string response) {
    routes[#routes+1] = { name: name, path: "/%{name}", response: response }
}

void fn handleRoutes(any req, any res, Route[] routes) {
    every string route in req.path
        every string i in routes
            if route == i.path {
                res.send(i.response)
            }
}

void fn handler(any req, any res) {
  registerRoute("test", "Test")
  registerRoute("", "Hello")
  handleRoutes(req, res, routes)
}

int port = 8080
writeln("%{port}")
server.start(port, handler)