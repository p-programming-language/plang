use writeln from @std.io
use request from @http

interface Response {
  () :: any json
}

Response res = request("https://api.sampleapis.com/coffee/hot", { method: "GET" })
writeln(res.json())