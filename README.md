# PLang
The P programming language
## Why?
becuz im bored
## Tools
- gpc
    - The general Plang compiler
- prepl
    - A interactive repl to run plang in your terminal

## installing
### On unix/linux:
```bash
    curl -sSL https://raw.githubusercontent.com/KevinAlavik/plang/main/install.sh | bash
```
### On Windows
Powershell:
```powershell
    Invoke-Expression (Invoke-WebRequest -Uri 'https://raw.githubusercontent.com/KevinAlavik/plang/main/install.ps1').Content
```
Command prompt:
```bash
    powershell -command "& { Invoke-WebRequest -Uri 'https://raw.githubusercontent.com/KevinAlavik/plang/main/install.bat' -OutFile 'install.bat'; .\install.bat; Remove-Item -Path 'install.bat' }"
```
## Current features
- Tokenizing:
    - Number literals (int, float)
    - String literals, supports both single and double quotes
    - Boolean literals
    - Identifiers
    - Keywords
    - Most symbols (`.`, `:`, `<`, `<=`, `>`, `>=`, all brackets, arithmetic operators, etc.)

---
**atm its only a tokenizer soon support for variables and functions**