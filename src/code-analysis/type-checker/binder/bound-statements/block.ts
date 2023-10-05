import { BoundStatement } from "../bound-node";
import type { Token } from "../../../syntax/token";
import UnionType from "../../types/union-type";
import BoundReturnStatement from "./return";
import AST from "../../../parser/ast";
import SingularType from "../../types/singular-type";

function containsReturn(stmt: BoundStatement): boolean {
  if ("body" in stmt)
    return containsReturn(<BoundStatement>stmt.body)
  else if ("statements" in stmt) {
    let contains = false;
    for (const statement of <BoundStatement[]>stmt.statements)
      contains ||= containsReturn(statement);

    return contains;
  }

  return stmt instanceof BoundReturnStatement
}

function getReturn(stmt: BoundStatement): BoundReturnStatement | BoundReturnStatement[] | undefined {
  if ("body" in stmt)
    return getReturn(<BoundStatement>stmt.body)
  else if ("statements" in stmt) {
    const returns = [];
    for (const statement of <BoundStatement[]>stmt.statements) {
      const returnStmt = getReturn(statement);
      if (!returnStmt) continue;
      returns.push(returnStmt);
    }
    return returns.flat();
  }

  if (stmt instanceof BoundReturnStatement)
    return stmt;
  else
    for (const value of Object.values(stmt))
      if (value instanceof BoundReturnStatement)
        return value;
}

export default class BoundBlockStatement extends BoundStatement {
  private readonly returnStatements = this.statements
    .filter(containsReturn)
    .flatMap(getReturn)
    .map(returnStmt => returnStmt?.type)
    .filter(stmt => stmt !== undefined);

  public readonly type = this.returnStatements.length === 0 ?
    new SingularType("undefined")
    : this.returnStatements.reduce((accum, current) => {
      if (accum instanceof UnionType)
        if (current instanceof UnionType)
          return new UnionType([...accum.types, ...current.types])
        else
          return new UnionType([...accum.types, <SingularType>current])
      else
        if (current instanceof UnionType)
          return new UnionType([<SingularType>accum, ...current.types])
        else
          return new UnionType([<SingularType>accum, <SingularType>current])
    });

  public constructor(
    public readonly token: Token,
    public readonly statements: BoundStatement[]
  ) { super(); }

  public accept<R>(visitor: AST.Visitor.BoundStatement<R>): R {
    return visitor.visitBlockStatement(this);
  }
}