#!/usr/bin/env node
import fs from "fs";
import { readln } from "../src/lib/utilities";

function main() {
    const args = process.argv.slice(2);

    if (args.length < 1) {
        console.error(`
Usage: ppl [option] <packageName>

PPL ~ PLang Package Library
--------------------------
Options:
  init        - Initialize a ppl project
  install     - Installs a package
  purge       - Removes a package
<packageName> - The package name
`);
        process.exit(1);
    }

    const [option] = args;
    switch (option) {
        case "init":
            initializeProject();
            break;
        case "install":
            if (args.length !== 2) {
                console.error("Error: Specify the package name to install.");
                process.exit(1);
            }
            const packageName = args[1];
            console.log(`Installing ${packageName}`);
            break;
        case "purge":
            break;
        default:
            console.error(`Error: Unknown option "${option}"`);
            process.exit(1);
    }
}

function initializeProject() {
    const projectName = "ppl.json";
    const appFileName = "src/app.p";

    readln("Enter your project name: ").then((name: any) => {
        readln("Enter project version: ").then((version: any) => {
            readln("Enter project description: ").then((description: any) => {
                const pplJsonContent = {
                    name,
                    version,
                    description
                };
                fs.writeFileSync(projectName, JSON.stringify(pplJsonContent, null, 2));
                fs.writeFileSync(appFileName, "include std.stdio");

                console.log("Initialized project. Edit src/app.p and run `ppl run`. Welcome to P!");
            });
        });
    });
}

main();
