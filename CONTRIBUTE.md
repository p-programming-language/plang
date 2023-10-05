# Contribute
Feel free to contribute! We greatly appreciate it!
## Commit Name
This can be anything as long as it is clear what the commit chnaged.

Examples:
- `fix: Fixed issue #12 (Fixed compiler issue)`
- `feat: create os() intrinsic function`
## Docs and guides
We currently don't have any documentation or guides for P. Feel free to create some yourself using the **docs/** folder!

## File guides
### src/
#### Files
- code-analysis/
    - parser/
        * This is where all parsing and AST code resides
    - syntax/
        * This is where anything to do with syntax recognition resides. This includes the lexer, keywords, syntax types, etc.
    - type-checker/
        * This is where all type checking and binding code resides, including bound AST nodes.
- runtime/
    * This is where all runtime code resides. This includes the interpreter, and all types that the interpreter may use such as functions or classes.

- utility.ts
    - This is where the utilities used by the **tools/** reside.
- errors.ts
    - This is where error handling and logging code resides.
- main.ts
    - This is a placeholder for testing as of right now.

### tools/
#### Adding tools
When adding a public tool (used by **npm** or **yarn** or any other JS runtime), you create a file in **tools/**. Please make sure to name the file the exact name of your tool. You will then need to add it to the `scripts` field in the `package.json` as well as the `bin` field.json

When adding a private tool: Do everything the same, but don't add it to `package.json`

**If the tool has like a category like `unit-tests`, create a folder for it.**
#### Files
- pint.ts
    - This is the CLI for the P Interpreter (PInt).
    - Info:
        - Name: pint
- repl.ts
    - This is an interactive terminal where you can run P line by line.
    - Info:
        - Name: prepl
- p.ts
    - This is a tool used to execute a P string or file. Used by `prepl` and `pint`.
- unit-tests/
    - This is where all unit tests reside (via mocha). These tests assure that each aspect of the lexer, parser, binder, resolver, type checker, and interpreter works as expected.

### tests/
Here are simple example files written in P that are executed during unit tests. When writing new examples, keep in mind that if any element of P errors during execution, unit tests will fail.