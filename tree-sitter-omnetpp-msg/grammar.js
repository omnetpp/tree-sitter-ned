// grammar.js
module.exports = grammar({
    name: 'msg',

    extras: $ => [
        /\s/,
        $._commentline,
    ],

    supertypes: $ => [
      $._targetitem
    ],
    
    rules: {

      msg_file: $ => repeat(choice(
        $.comment,
        $._EMPTYLINE,
        $.namespace,
        $.property,
        $.cplusplus,
        $.import,
        $.struct_decl,
        $.class_decl,
        $.message_decl,
        $.packet_decl,
        $.enum_decl,
        $.enum,
        $.message,
        $.packet,
        $.class,
        $.struct
      )),

      cplusplus: $ => seq(
        'cplusplus',
        optional(seq('(', alias($.targetspec, $.target), ')')),
        '{{',
        alias(repeat(choice(
          $._cplusplus_braced_content,
          $._cplusplus_string_literal,
          /[^{}]/
        )), $.body),
        '}}',
        optional(';')
      ),
  
      _cplusplus_braced_content: $ => seq(
        '{',
        repeat(choice(
          $._cplusplus_braced_content,
          $._cplusplus_string_literal,
          /[^{}]/
        )),
        '}'
      ),
  
      _cplusplus_string_literal: $ => choice(
        seq('"', repeat(choice(/[^"\\]/, /\\./)), '"'),
        seq("'", repeat(choice(/[^'\\]/, /\\./)), "'")
      ),

      comment: $ => prec.right(repeat1($._commentline)),

      _commentline: _ => token(choice(
        seq('//', /(\\+(.|\r?\n)|[^\\\n])*/),
        seq(
          '/*',
          /[^*]*\*+([^/*][^*]*\*+)*/,
          '/',
        ),    // TODO is that needed in msg files?
      )),
  
      namespace: $ => seq('namespace', optional(alias($._qname, $.name)), ';'),
  
      _qname: $ => seq(optional('::'), $._NAME, repeat(seq('::', $._NAME))),
  
      targetspec: $ => seq($._targetitem, repeat($._targetitem)),
  
      _targetitem: $ => choice($._NAME, '::', $._INTCONSTANT, ':', '.', ',', '~', '=', '&'),
  
      import: $ => seq('import', alias($.importspec, $.import_qname), ';'),

      importspec: $ => choice($.import_un_qname, seq(repeat(seq($._importname, '.')), $.import_un_qname)),

      import_un_qname: $ => $._importname,
  
      _importname: $ => choice($._NAME, 'message', 'packet', 'class', 'struct', 'enum', 'abstract'),
  
      struct_decl: $ => seq('struct', alias($._qname, $.name), ';'),
  
      class_decl: $ => seq('class', optional('noncobject'), alias($._qname, $.name), optional(seq('extends', alias($._qname, $.extends))), ';'),
          
      message_decl: $ => seq('message', alias($._qname, $.name), ';'),
  
      packet_decl: $ => seq('packet', alias($._qname, $.name), ';'),
  
      enum_decl: $ => seq('enum', alias($._qname, $.name), ';'),
  
      enum: $ => prec(10, seq(optional($.comment), 'enum', alias($._qname, $.name), '{', alias(repeat(choice($._enumfield_or_property, $.comment, $._EMPTYLINE)), $.body), '}', optional(';'))),
    
      _enumfield_or_property: $ => prec.right(seq(choice(alias($.enumfield, $.field), $.property), optional($.comment))),
  
      enumfield: $ => seq(alias($._NAME, $.name), optional(seq('=', alias($.enumvalue, $.value))), ';'),
  
      enumvalue: $ => choice($._INTCONSTANT, seq('-', $._INTCONSTANT), $._NAME),
  
      message: $ => prec(10, seq(optional($.comment), $._message_header, $._body)),
  
      packet: $ => prec(10, seq(optional($.comment), $._packet_header, $._body)),
  
      class: $ => prec(10, seq(optional($.comment), $._class_header, $._body)),
  
      struct: $ => prec(10, seq(optional($.comment), $._struct_header, $._body)),
  
      _message_header: $ => seq('message', alias($._qname, $.name), optional(seq('extends', alias($._qname, $.extends)))),
  
      _packet_header: $ => seq('packet', $._qname, optional(seq('extends', $._qname))),
  
      _class_header: $ => seq('class', alias(prec.left($._qname), $.name), optional(seq('extends', alias($._qname, $.extends)))),
  
      _struct_header: $ => seq('struct', alias($._qname, $.name), optional(seq('extends', alias($._qname, $.extends)))),
  
      _body: $ => seq('{', optional(/\s/), alias(repeat(seq(choice($.field, $.property, $.comment, $._EMPTYLINE), optional($.comment))), $.body), '}', optional(';')),
  
      field: $ => choice(
        seq($._fieldtypename, optional(alias($.opt_fieldvector, $.vector)), optional($._inline_properties), ';'),
        seq($._fieldtypename, optional(alias($.opt_fieldvector, $.vector)), optional($._inline_properties), '=', alias($.fieldvalue, $.value), optional($._inline_properties), ';'),
      ),
  
      _fieldtypename: $ => seq(optional('abstract'), alias(optional($._fielddatatype), $.type), alias($._NAME, $.name)),
    
      _fielddatatype: $ => choice(
        $._fieldsimpledatatype,
        seq($._fieldsimpledatatype, '*'),
        seq('const', $._fieldsimpledatatype),
        seq('const', $._fieldsimpledatatype, '*')
      ),
  
      _fieldsimpledatatype: $ => choice(
        $._qname,
        'char', 'short', 'int', 'long',
        seq('unsigned', 'char'),
        seq('unsigned', 'short'),
        seq('unsigned', 'int'),
        seq('unsigned', 'long'),
        'double', 'string', 'bool'
      ),
  
      opt_fieldvector: $ => choice(
        seq('[', alias($._INTCONSTANT, $.size), ']'),
        seq('[', alias($._qname, $.name), ']'), // TODO can this be a name?
        seq('[', ']')
      ),
  
      fieldvalue: $ => repeat1($._fieldvalueitem),
  
      _fieldvalueitem: $ => choice(
        $._STRINGCONSTANT,
        $._CHARCONSTANT,
        $._INTCONSTANT,
        $._REALCONSTANT,
        'true',
        'false',
        $._NAME,
        '::',
        '?', ':', '&&', '||', '##', '==', '!=', '>', '>=', '<', '<=',
        '&', '|', '#', '<<', '>>',
        '+', '-', '*', '/', '%', '^', '!', '~',
        '.', ',', '(', ')', '[', ']'
      ),

      property: $ => seq('@', $._prop_body, ';'),

      _prop_body: $ => seq(alias($._NAME, $.name), optional(seq('[', alias($._NAME, $.index),']')), optional($._prop_parenthesized)),

      _prop_parenthesized: $ => prec.right(seq('(', alias(repeat1($._prop_value), $.value), ')')),
      
      _prop_value: $ => choice(
        $._prop_value_parenthesized,
        /[^\(\)]+/
      ),

      _prop_value_parenthesized: $ => prec.right(seq('(', repeat($._prop_value), ')')),

      cplusplus_parenthesized: $ => seq(
        '(',
        repeat(choice(
          $.cplusplus_parenthesized,
          /[^\(\);]/
        )),
        ')'
      ),
  
      _inline_properties: $ => repeat1(alias($.inline_property, $.property)),

      inline_property: $ => seq('@', $._prop_body),
  
      _NAME: $ => /[a-zA-Z_][a-zA-Z0-9_]*/,
      _INTCONSTANT: $ => /0[xX][0-9a-fA-F]+|[0-9]+/,
      _REALCONSTANT: $ => /[0-9]*\.[0-9]+([eE][+-]?[0-9]+)?/,
      _CHARCONSTANT: $ => /'[^']'/,
      _CHARCONSTANTWOEQ: $ => /'[^=']'/,
      _STRINGCONSTANT: $ => /"([^"\\]|\\.)*"/,
      _STRINGCONSTANTWITHOUTEQ: $ => /"([^="\\]|\\.)*"/,
      _EMPTYLINE: $ => /\r?\n\s*\r?\n\s*/,
    }
  });
  