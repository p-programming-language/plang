use writeln from @std.io

writeln(1 is int) ## true
writeln(typeof 1) ## int

type Number = int | float
Number x = 6
writeln(typeof x) ## int | float