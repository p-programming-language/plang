import type { PropertyDeclarationStatement } from "../statements/property-declaration";
import type { MethodDeclarationStatement } from "../statements/method-declaration";
import type BoundPropertyDeclarationStatement from "../../../binder/bound-statements/property-declaration";
import type BoundMethodDeclarationStatement from "../../../binder/bound-statements/method-declaration";

export type ClassMember = PropertyDeclarationStatement | MethodDeclarationStatement;
export type BoundClassMember = BoundPropertyDeclarationStatement | BoundMethodDeclarationStatement;