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
(inline_comment) @comment
(importspec) @comment
(data_type) @type
(_targetitem) @variable.parameter
(prop_name) @prop