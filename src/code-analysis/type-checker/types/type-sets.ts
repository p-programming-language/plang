import SingularType from "./singular-type";
import UnionType from "./union-type";

export const INDEX_TYPE = new UnionType([
  new SingularType("string"),
  new SingularType("int")
]);

export const INDEXABLE_LITERAL_TYPES = [
  new SingularType("string")
];

export const INTRINSIC_EXTENDED_LITERAL_VALUE_TYPES = [
  "string"
];

export const INTRINSIC_EXTENDED_LITERAL_TYPES = INTRINSIC_EXTENDED_LITERAL_VALUE_TYPES
  .map(name => new SingularType(name));