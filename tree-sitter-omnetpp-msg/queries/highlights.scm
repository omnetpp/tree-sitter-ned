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
; (inline_comment) @comment
(import_qname) @comment
(type) @type
; (_targetitem) @variable.parameter
(property (name) @prop)
(cplusplus (body) @variable.parameter)
(cplusplus (target) @target)
(value) @variable.parameter