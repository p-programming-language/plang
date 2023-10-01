@echo off
git clone https://github.com/KevinAlavik/plang

cd plang

yarn install > nul

cd ..

rmdir /s /q plang
