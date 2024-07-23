; highlights.scm

; "class" @keyword
; "return" @keyword
; (type_identifier) @type
; (int_literal) @number
; (function_declaration name: (identifier) @function)

"class" @keyword
"packet" @keyword
"import" @keyword
"struct" @keyword
"enum" @keyword
"extends" @keyword
"cplusplus" @keyword
(comment) @comment
; (importspec) @value
; (import (name) @value)
(name) @value
(type) @type
(property (name) @prop_name)
(cplusplus (body) @cpp_body)
(cplusplus (target) @target)
(value) @value

; (_targetitem) @variable.parameter
; (inline_comment) @comment
