import { conf as conf$1, language as language$1 } from "./typescript.js";
import "./app.js";
/*!-----------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Version: 0.44.0(3e047efd345ff102c8c61b5398fb30845aaac166)
 * Released under the MIT license
 * https://github.com/microsoft/monaco-editor/blob/main/LICENSE.txt
 *-----------------------------------------------------------------------------*/
var conf = conf$1;
var language = {
  defaultToken: "invalid",
  tokenPostfix: ".js",
  keywords: [
    "break",
    "case",
    "catch",
    "class",
    "continue",
    "const",
    "constructor",
    "debugger",
    "default",
    "delete",
    "do",
    "else",
    "export",
    "extends",
    "false",
    "finally",
    "for",
    "from",
    "function",
    "get",
    "if",
    "import",
    "in",
    "instanceof",
    "let",
    "new",
    "null",
    "return",
    "set",
    "static",
    "super",
    "switch",
    "symbol",
    "this",
    "throw",
    "true",
    "try",
    "typeof",
    "undefined",
    "var",
    "void",
    "while",
    "with",
    "yield",
    "async",
    "await",
    "of"
  ],
  typeKeywords: [],
  operators: language$1.operators,
  symbols: language$1.symbols,
  escapes: language$1.escapes,
  digits: language$1.digits,
  octaldigits: language$1.octaldigits,
  binarydigits: language$1.binarydigits,
  hexdigits: language$1.hexdigits,
  regexpctl: language$1.regexpctl,
  regexpesc: language$1.regexpesc,
  tokenizer: language$1.tokenizer
};
export {
  conf,
  language
};
