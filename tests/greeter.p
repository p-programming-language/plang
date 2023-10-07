(string name) :: void fn greeter(string greeting = "Hello") {
  void fn greet(string name) {
    println "%{greeting}, %{name}!"
  }

  return greet
}

(string name) :: void greetEnglish = greeter();
(string name) :: void greetSpanish = greeter("Hola")
greetEnglish("Kevin")
greetSpanish("Kevin")