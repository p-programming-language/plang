import SingularType from "./singular-type";
import UnionType from "./union-type";


export const INDEX_TYPE = new UnionType([
  new SingularType("string"),
  new SingularType("int")
]);

export const INDEXABLE_LITERAL_TYPES = [
  new SingularType("string"),
  new SingularType("Range")
];

export const INTRINSIC_EXTENDED_LITERAL_VALUE_TYPES: string[] = [
  ...INDEXABLE_LITERAL_TYPES.map(t => t.name)
];

export const INTRINSIC_EXTENDED_LITERAL_TYPES = INTRINSIC_EXTENDED_LITERAL_VALUE_TYPES
  .map(name => new SingularType(name));

export const INTRINSIC_TYPES = new Set<string>([
  "int", "float", "string", "bool",
  "undefined", "null", "void",
  "any", "Array", "Range"
]);
