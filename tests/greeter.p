use writeln from @std.io

(string name) :: void fn greeter(string greeting = "Hello") {
  void fn greet(string name) {
    writeln("%{greeting}, %{name}!")
  }

  return greet
}

(string name) :: void greetEnglish = greeter();
(string name) :: void greetSpanish = greeter("Hola")
greetEnglish("Kevin")
greetSpanish("Kevin")