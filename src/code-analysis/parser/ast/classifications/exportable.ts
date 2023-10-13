import type { VariableDeclarationStatement } from "../statements/variable-declaration";
import type { FunctionDeclarationStatement } from "../statements/function-declaration";
import type { ClassDeclarationStatement } from "../statements/class-declaration";
import type { TypeDeclarationStatement } from "../statements/type-declaration";
import type BoundVariableDeclarationStatement from "../../../binder/bound-statements/variable-declaration";
import type BoundFunctionDeclarationStatement from "../../../binder/bound-statements/function-declaration";
import type BoundClassDeclarationStatement from "../../../binder/bound-statements/class-declaration";
import type BoundTypeDeclarationStatement from "../../../binder/bound-statements/type-declaration";

export type Exportable =
  | VariableDeclarationStatement
  | FunctionDeclarationStatement
  | ClassDeclarationStatement
  | TypeDeclarationStatement;

export type BoundExportable =
  | BoundVariableDeclarationStatement
  | BoundFunctionDeclarationStatement
  | BoundClassDeclarationStatement
  | BoundTypeDeclarationStatement;