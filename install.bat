@echo off
git clone https://github.com/p-programming-language/plang

cd plang

npm install > nul
yarn run path > nul

cd ..

rmdir /s /q plang
