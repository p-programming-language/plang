import toCamelCase from "to-camel-case";

import type { ValueType } from "../../../../code-analysis/type-checker";
import type { Type } from "../../../../code-analysis/type-checker/types/type";
import SingularType from "../../../../code-analysis/type-checker/types/singular-type";
import UnionType from "../../../../code-analysis/type-checker/types/union-type";
import Intrinsic from "../../../values/intrinsic";

const NUMBER_TYPE = new UnionType([
  new SingularType("int"),
  new SingularType("float")
]);

export default class MathLib extends Intrinsic.Lib {
  public get propertyTypes(): Record<string, Type> {
    return {
      pi: new SingularType("float"),
      e: new SingularType("float"),
    };
  }

  public get members(): Record<string, ValueType> {
    const libName = this.name;
    return {
      pi: Math.PI,
      e: Math.E,
      inf: Infinity,

      random: class Random extends Intrinsic.Function {
        public readonly name = `${libName}.${toCamelCase(this.constructor.name)}`;
        public readonly returnType = new SingularType("float");
        public readonly argumentTypes = {};

        public call(): number {
          return Math.random();
        }
      },
      sin: class Sin extends Intrinsic.Function {
        public readonly name = `${libName}.${toCamelCase(this.constructor.name)}`;
        public readonly returnType = new SingularType("float");
        public readonly argumentTypes = { n: NUMBER_TYPE };

        public call(n: number): number {
          return Math.sin(n);
        }
      },
      cos: class Cos extends Intrinsic.Function {
        public readonly name = `${libName}.${toCamelCase(this.constructor.name)}`;
        public readonly returnType = new SingularType("float");
        public readonly argumentTypes = { n: NUMBER_TYPE };

        public call(n: number): number {
          return Math.cos(n);
        }
      },
      tan: class Tan extends Intrinsic.Function {
        public readonly name = `${libName}.${toCamelCase(this.constructor.name)}`;
        public readonly returnType = new SingularType("float");
        public readonly argumentTypes = { n: NUMBER_TYPE };

        public call(n: number): number {
          return Math.tan(n);
        }
      },
      sinh: class Sinh extends Intrinsic.Function {
        public readonly name = `${libName}.${toCamelCase(this.constructor.name)}`;
        public readonly returnType = new SingularType("float");
        public readonly argumentTypes = { n: NUMBER_TYPE };

        public call(n: number): number {
          return Math.sin(n);
        }
      },
      cosh: class Cosh extends Intrinsic.Function {
        public readonly name = `${libName}.${toCamelCase(this.constructor.name)}`;
        public readonly returnType = new SingularType("float");
        public readonly argumentTypes = { n: NUMBER_TYPE };

        public call(n: number): number {
          return Math.cosh(n);
        }
      },
      tanh: class Tanh extends Intrinsic.Function {
        public readonly name = `${libName}.${toCamelCase(this.constructor.name)}`;
        public readonly returnType = new SingularType("float");
        public readonly argumentTypes = { n: NUMBER_TYPE };

        public call(n: number): number {
          return Math.tanh(n);
        }
      },
      abs: class Abs extends Intrinsic.Function {
        public readonly name = `${libName}.${toCamelCase(this.constructor.name)}`;
        public readonly returnType = NUMBER_TYPE;
        public readonly argumentTypes = { n: NUMBER_TYPE };

        public call(n: number): number {
          return Math.abs(n);
        }
      },
      sqrt: class Sqrt extends Intrinsic.Function {
        public readonly name = `${libName}.${toCamelCase(this.constructor.name)}`;
        public readonly returnType = NUMBER_TYPE;
        public readonly argumentTypes = { n: NUMBER_TYPE };

        public call(n: number): number {
          return Math.sqrt(n);
        }
      },
      exp: class Exp extends Intrinsic.Function {
        public readonly name = `${libName}.${toCamelCase(this.constructor.name)}`;
        public readonly returnType = NUMBER_TYPE;
        public readonly argumentTypes = { n: NUMBER_TYPE };

        public call(n: number): number {
          return Math.exp(n);
        }
      },
      log: class Log extends Intrinsic.Function {
        public readonly name = `${libName}.${toCamelCase(this.constructor.name)}`;
        public readonly returnType = NUMBER_TYPE;
        public readonly argumentTypes = { n: NUMBER_TYPE, base: NUMBER_TYPE };
      
        public call(n: number, base: number): number {
          return Math.log(n) / Math.log(base);
        }
      },
      ceil: class Ceil extends Intrinsic.Function {
        public readonly name = `${libName}.${toCamelCase(this.constructor.name)}`;
        public readonly returnType = NUMBER_TYPE;
        public readonly argumentTypes = { n: NUMBER_TYPE };

        public call(n: number): number {
          return Math.ceil(n);
        }
      },
      floor: class Floor extends Intrinsic.Function {
        public readonly name = `${libName}.${toCamelCase(this.constructor.name)}`;
        public readonly returnType = NUMBER_TYPE;
        public readonly argumentTypes = { n: NUMBER_TYPE };

        public call(n: number): number {
          return Math.floor(n);
        }
      },
      pow: class Pow extends Intrinsic.Function {
        public readonly name = `${libName}.${toCamelCase(this.constructor.name)}`;
        public readonly returnType = NUMBER_TYPE;
        public readonly argumentTypes = { base: NUMBER_TYPE, exp: NUMBER_TYPE };
      
        public call(base: number, exp: number): number {
          return Math.pow(base, exp);
        }
      }
    };
  }
}