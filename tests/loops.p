every int i in 1..5
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