# Contribute
Feel free to contribute! We really appreciate it
## Commit Name
This can be anything as long as it is clear what the commit chnaged.

Example: `fix: Fixed issue #12 (Fixed compiler issue)`
## Docs and guides
As of now we dont have any documentation or guides for P feel free to add them, use a the **docs/** folder.
## File guides
### src/
#### Files
- code-analysis/
    - Here lays the tokenizer and parser code
- compilation/
    - Here lays the codegen to compile the P code into assembly (currently just placeholders)
- lib/
    - Here lays some utilities used by the **tools**

- errors.ts
    - Error handeling
- main.ts
    - Some testing
### tools/
#### Adding tools
When adding a public tool (used by **npm** or **yarn** or any other js runtime) you make a file in **tools/** (please use the tool name in the file name). Then add it to the scripts in package.json but also in the "bin" field of the package.json

When adding a private tool: Just do the same but dont add it to package.json

**If the tool has like a category like *unit-tests* make a folder for it**
#### Files
- comp.ts 
    - This is the gpc code
    - Info:
        - Name: gpc
- p.ts 
    - This is a tool used by the prepl and gpc
    - Info:
        - Name: null
- ppl.ts 
    - This is the package manager for P (currently just placeholder)
    - Info:
        - Name: ppl
- repl.ts 
    - This is a interactive CLI where you can run P directly in the terminal
    - Info:
        - Name: prepl
- unit-tests/
    - Here lays some simple tests to test the lexer and parser to check that everything works as intended

### tests/
Here are simple tests written in **p** that automaticlly runs on the test script, when writing new tests just put them in there no need to add them to anywhere. Its automaticlly running all the files there.