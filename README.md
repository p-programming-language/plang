# PLang
The P programming language

![Last Commit](https://img.shields.io/github/last-commit/p-programming-language/plang)
![GitHub code size in bytes](https://img.shields.io/github/languages/code-size/p-programming-language/plang)
![GitHub top language](https://img.shields.io/github/languages/top/p-programming-language/plang)
![Lines of Code](https://img.shields.io/tokei/lines/github/p-programming-language/plang)

![license](https://img.shields.io/github/license/p-programming-language/plang)

[![testing](https://github.com/KevinAlavik/plang/actions/workflows/test.yml/badge.svg)](https://github.com/KevinAlavik/plang/actions/workflows/test.yml)
[![njsscan sarif](https://github.com/p-programming-language/plang/actions/workflows/njsscan.yml/badge.svg)](https://github.com/p-programming-language/plang/actions/workflows/njsscan.yml)

## Why?
becuz im bored

## Examples
Check out **[examples/](https://github.com/p-programming-language/plang/tree/main/examples)** for some examples.

## Tools
- pint
    - The P interpreter CLI
- prepl
    - A read-eval-print loop to run P interactively inside of your terminal
- ast-viewer
    - This is an interactive terminal where you can inspect the AST of a provided source code node-by-node

### Developer only tools
- test
    - Runs unit tests

## Installation
### Unix:
```bash
curl -sSL https://raw.githubusercontent.com/p-programming-language/plang/main/install.sh | bash
```
### Windows:
PowerShell:
```powershell
Invoke-Expression (Invoke-WebRequest -Uri 'https://raw.githubusercontent.com/p-programming-language/plang/main/install.ps1').Content
```
Command Prompt:
```bash
powershell -command "& { Invoke-WebRequest -Uri 'https://raw.githubusercontent.com/p-programming-language/plang/main/install.bat' -OutFile 'install.bat'; .\install.bat; Remove-Item -Path 'install.bat' }"
```
### Building from source:
Simply run:
```bash
npm run build
```
or:
```bash
yarn run build
```
**Then you can access our [tools](https://github.com/p-programming-language/plang?tab=readme-ov-file#tools) using:**
```bash
npm run <tool>
```
or:
```bash
yarn run <tool>
```

## Current Features
- Type analysis & hoisting before parsing
- Tokenizing:
    - Number literals (int, float)
    - String literals, supports both single and double quotes
    - Boolean literals
    - Identifiers
    - Keywords
    - Symbols (`+`, `-`, etc.)
    - Comments (`## single line`, `##: multi line :##`)
- Parsing + Binding + Type checking + Interpreting:
    - Literals
        - Basics (numbers, strings, booleans)
        - String interpolations
        - Array literals/types
        - Object literals/types
    - Array indexing
    - Binary expressions (including compound assignment)
    - Unary expressions (including `++` and `--`)
    - Variable declarations (mutability optional)
    - Variable assignment (`:=` and `=` operators)
    - Property assignment
    - Function declarations and calls

## Planned Features
- Type guards (`value is T`, `T extends U`)
- Spread types
- Parenthesized types
- Type casting
- Throw statement
- Switch statement
- Array intrinsic extension
- `System` intrinsic library
- `HTTP` intrinsic library
- `setRecursionDepth` macro
- Better CLI
- Classes