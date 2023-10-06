#!/usr/bin/env node
import ASTViewer from "./classes/ast-viewer";
import P from "./p";

const p = new P;
ASTViewer.start(p.interpreter.binder);