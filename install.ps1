git clone https://github.com/p-programming-language/plang

Set-Location -Path .\plang
npm install > $null
yarn path > $null

Set-Location -Path ..

Remove-Item -Path .\plang -Recurse -Force
