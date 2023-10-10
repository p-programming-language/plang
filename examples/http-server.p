use writeln from @std/io
use Server from @http

any server = new Server
void fn handler(any req, any res) {
  res.send("Hello, world!")
}

int port = 8080
writeln("Listening on http://localhost:%{port}")
server.start(port, handler)