import type { NativePropertyValue, NumberValue, Value } from "./values";
import type { PropertyNature } from "./lib/PropertyNature";
import type { AndAssignmentNode, AndNode, ArgumentNode, CustomNode, OrAssignmentNode, OrNode } from "./nodes";
import type { Visibility } from "./lib/Visibility";
import type { Types } from "./tokens";
import type RuntimeResult from "./runtime";
import type Position from "./position";
import type Context from "./context";

declare global {
  interface Window {
    Versa: any;
    VersaHTMLElement: any;
  }

  type VariableStrictType = Types;
  type TokenData = null | { allow_concatenation: boolean };
  
  // interface VariableValue<T = any> {
  //   type: string;
  //   value: Value<T>;
  // }

  interface SwitchCase {
    conditions: CustomNode[];
    body: CustomNode;
  }

  interface TagMember {
    prop: number;
    state: number;
    optional: number;
    value: Value;
  }

  interface ClassMember {
    status: Visibility;
    value: Value;
    static_prop: number;
  }

  type FileStore = Map<string, string>;

  type ClassInstanciation = Map<string, ClassMember>;
  type TagInstanciation = Map<string, TagMember>;
  type NativeClassInstanciation = Map<string, { status: Visibility, value: NativePropertyValue, static_prop: number }>;
  type NativeBehavior = (exec_ctx: Context, pos_start: Position, pos_end: Position) => RuntimeResult;
  type EnumProperties = Map<string, NumberValue>;
  type ConditionalNode = AndNode | OrNode | AndAssignmentNode | OrAssignmentNode;

  type NativeClasses = {
    [key: string]: {
      name: string;
      properties: {
        name: string;
        nature: PropertyNature;
        type: string;
        status: Visibility;
        static_prop: number;
        value: {
          args?: ArgumentNode[];
          behavior: NativeBehavior;
        }
      }[];
    };
  };

  interface NativeFunctionType {
    args?: ArgumentNode[];
    behavior: NativeBehavior | (() => void); // () => void just because of "exit" who cannot return anything
  }

  interface NativeTag {
    name: string;
    props: string[];
  }
}

export {};