git clone https://github.com/KevinAlavik/plang

Set-Location -Path .\plang

yarn install > $null

Set-Location -Path ..

Remove-Item -Path .\plang -Recurse -Force
