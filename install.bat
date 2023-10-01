@echo off
git clone https://github.com/KevinAlavik/plang

cd plang

npm install > nul
yarn run path > nul

cd ..

rmdir /s /q plang
