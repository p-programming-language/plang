string error
if #argv < 2 {
    error = "Usage: " + argv[0] + " <name>"
    println(error)
} else {
    println("Hello " + argv[1])
}