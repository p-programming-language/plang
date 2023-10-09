use writeln from @std/io

every int i in 5
  writeln(i)

every int i in 5..1
  writeln(i)

every string char in "abc"
  writeln(char)

every string k, bool v in { epic: true } {
  writeln(k)
  writeln(v)
}

mut int i = 0
while true {
  if i == 5 break
  writeln(++i)
}

i = 0
while i < 10 {
  if ++i % 2 == 0 next
  writeln(i)
}