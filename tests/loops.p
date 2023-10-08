every int i in 5
  println i

every int i in 5..1
  println i

every string char in "abc"
  println char

every string k, bool v in { epic: true }
  println k, v

mut int i = 0
while true {
  if i == 5 break
  println ++i
}

i = 0
while i < 10 {
  if ++i % 2 == 0 next
  println i
}