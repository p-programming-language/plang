any fn greeter(string greeting = "Hello") {
  void fn greet(string name) {
    println "%{greeting}, %{name}!"
  }

  return greet
}

any greetEnglish = greeter()
any greetSpanish = greeter("Hola")
greetEnglish("Kevin")
greetSpanish("Kevin")