; Comments
(comment) @comment

; Type-definition keywords
[
  "module"
  "simple"
  "network"
  "channel"
  "moduleinterface"
  "channelinterface"
] @keyword

; Declaration / structural keywords
[
  "package"
  "import"
  "property"
  "extends"
  "like"
] @keyword

(allowunconnected) @keyword

; Section keywords
[
  "parameters"
  "gates"
  "types"
  "submodules"
  "connections"
] @keyword

; Parameter / gate modifiers and value keywords
[
  "volatile"
  "default"
  "ask"
] @keyword

; Control flow (connection loops and conditions)
[
  "for"
  "if"
] @keyword

; Built-in operator words and special references
[
  "this"
  "parent"
  "index"
  "typename"
  "sizeof"
  "exists"
  "xmldoc"
] @function.builtin

; Parameter types and gate directions (both alias to (type))
(type) @type

; Inheritance / instantiation type references
(extends) @type
(implements) @type
(like_type) @type
(submodule type: (type) @type)

; Type-definition names
(simple name: (name) @type)
(module name: (name) @type)
(network name: (name) @type)
(channel name: (name) @type)
(moduleinterface name: (name) @type)
(channel_interface name: (name) @type)

; Submodule instance names
(submodule name: (name) @variable)

; Function / method calls
(call (name) @function)

; Literals
(string) @string
(number) @number
(quantity) @number
(boolean) @boolean
(constant) @constant.builtin

; Properties (@display, @signal, @statistic, ...)
(property (name) @attribute)
(property_decl_header (name) @attribute)

; Connection arrows, subgates and gate-append
(arrow) @operator
(subgate) @operator
(plusplus) @operator

; Expression operators
[
  "+" "-" "*" "/" "%" "^"
  "==" "!=" "<" ">" "<=" ">=" "<=>" "=~"
  "&&" "||" "##"
  "!" "~" "&" "|" "#" "<<" ">>"
  "?" ":" "="
] @operator

; Package and import paths
(package (name) @module)
(import (name) @module)

; Punctuation
[ "(" ")" "[" "]" "{" "}" ] @punctuation.bracket
[ ";" "," ":" "." ] @punctuation.delimiter
