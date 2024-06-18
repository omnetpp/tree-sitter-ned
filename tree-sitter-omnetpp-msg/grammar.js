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

    // conflicts: $ => [
    //   [$.prop_cpp, $.prop_keyvaluepair, $._prop_value]
    // ],
    
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
  
      namespace: $ => seq('namespace', optional(alias($._qname, $.name)), ';'),  // FIXME _qname is optional???
  
      _qname: $ => seq(optional('::'), $._NAME, repeat(seq('::', $._NAME))),
  
  
      targetspec: $ => seq($._targetitem, repeat($._targetitem)),
  
      _targetitem: $ => choice($._NAME, '::', $._INTCONSTANT, ':', '.', ',', '~', '=', '&'),
  
      import: $ => seq('import', $.importspec, ';'),
  
      // importspec: $ => seq($._importname, repeat(seq('.', $._importname))),

      importspec: $ => choice($.import_un_qname, seq(repeat(seq($._importname, '.')), $.import_un_qname)),

      import_un_qname: $ => $._importname,
  
      _importname: $ => choice($._NAME, 'message', 'packet', 'class', 'struct', 'enum', 'abstract'),
  
      struct_decl: $ => seq('struct', alias($._qname, $.name), ';'),
  
      class_decl: $ => seq('class', optional('noncobject'), alias($._qname, $.name), optional(seq('extends', alias($._qname, $.extends_name))), ';'),
          
      message_decl: $ => seq('message', alias($._qname, $.name), ';'),
  
      packet_decl: $ => seq('packet', alias($._qname, $.name), ';'),
  
      enum_decl: $ => seq('enum', alias($._qname, $.name), ';'),
  
      enum: $ => prec(10, seq(optional($.comment), 'enum', alias($._qname, $.name), '{', alias(repeat(choice($._enumfield_or_property, $.comment, $._EMPTYLINE)), $.source_code), '}', optional(';'))),
    
      _enumfield_or_property: $ => prec.right(seq(choice($.enumfield, $.property), optional($.comment))),
  
      enumfield: $ => seq(alias($._NAME, $.name), optional(seq('=', alias($.enumvalue, $.value))), ';'),
  
      enumvalue: $ => choice($._INTCONSTANT, seq('-', $._INTCONSTANT), $._NAME),
  
      message: $ => prec(10, seq(optional($.comment), $._message_header, $._body)),
  
      packet: $ => prec(10, seq(optional($.comment), $._packet_header, $._body)),
  
      class: $ => prec(10, seq(optional($.comment), $._class_header, $._body)),
  
      struct: $ => prec(10, seq(optional($.comment), $._struct_header, $._body)),
  
      _message_header: $ => seq('message', alias($._qname, $.name), optional(seq('extends', alias($._qname, $.extends_name)))),
  
      _packet_header: $ => seq('packet', $._qname, optional(seq('extends', $._qname))),
  
      _class_header: $ => seq('class', alias(prec.left($._qname), $.name), optional(seq('extends', alias($._qname, $.extends_name)))),
  
      _struct_header: $ => seq('struct', alias($._qname, $.name), optional(seq('extends', alias($._qname, $.extends_name)))),
  
      _body: $ => seq('{', optional(/\s/), alias(repeat(seq(choice($.field, $.property, $.comment, $._EMPTYLINE), optional($.comment))), $.source_code), '}', optional(';')),
  
      field: $ => choice(
        seq($._fieldtypename, optional($.opt_fieldvector), optional(alias($.inline_properties, $.property)), ';'),
        seq($._fieldtypename, optional($.opt_fieldvector), optional(alias($.inline_properties, $.property)), '=', alias($.fieldvalue, $.value), optional(alias($.inline_properties, $.property)), ';'),
      ),

      // inline_comment: $ => token.immediate((seq(/[^\n\/]*/, '//', /[^\n]*/))),
  
      _fieldtypename: $ => seq(optional('abstract'), alias(optional($._fielddatatype), $.data_type), alias($._NAME, $.name)),
    
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
        seq('[', $._INTCONSTANT, ']'),
        seq('[', $._qname, ']'),
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

      // prop_cpp: $ => alias(repeat1(choice(
      //   // $._cplusplus_braced_content,
      //   // $._cplusplus_string_literal,
      //   /[^\(\)=;]+/,
      //   $.cplusplus_parenthesized_prop,
      // )), $.cplusplus__body),

      cplusplus_parenthesized: $ => seq(
        '(',
        repeat(choice(
          // $._cplusplus_braced_content,
          // $._cplusplus_string_literal,
          $.cplusplus_parenthesized,
          /[^\(\);]/
        )),
        ')'
      ),

      // cplusplus_parenthesized_prop: $ => seq(
      //   '(',
      //   repeat(choice(
      //     // $._cplusplus_braced_content,
      //     // $._cplusplus_string_literal,
      //     $.cplusplus_parenthesized_prop,
      //     /[^\(\);=]/
      //   )),
      //   ')'
      // ),

      // property_tag: $ => choice(
      //   prec(10, alias($._NAME, $._prop_value)),
      //   prec(100, $.prop_keyvaluepair),
      //   prec(0, $.prop_cpp),
      //   prec(10, $._INTCONSTANT)
      // ),

      // prop_keyvaluepair: $ => seq(alias($._NAME, $.name), '=', alias(/[^@;\(\)=]*/, $.value)),
  
      inline_properties: $ => repeat1(seq('@', $._prop_body)),
  
      // property_NAMEvalues: $ => seq($.property_NAMEvalue, ';'),

      // property_NAMEvalues: $ => prec.right(seq($.property_NAMEvalue, repeat(seq(';', $.property_NAMEvalue)))),
  
      // property_NAMEvalue: $ => choice(
      //   $.property_NAME,
      //   seq($.property_NAME, '(', optional($.property_keys), ')'),
      //   seq('enum', '(', $._NAME, ')'),
      //   // seq($.property_NAME, '(', optional(choice($.PROPERTYPARAMETER, optional($.propertyparameter_parenthesizedblock))), ')')
      // ),

      // // propertyparameter_parenthesizedblock: $ => seq('(', optional($.PROPERTYPARAMETER), ')'),
  
      // property_NAME: $ => choice(
      //   seq('@', $.PROP_NAME),
      //   seq('@', $.PROP_NAME, '[', $.PROP_NAME, ']')
      // ),
  
      // property_keys: $ => repeat1($.property_key),
  
      // property_key: $ => choice(
      //   seq($.property_literal, '=', $.property_values),
      //   $.property_values
      // ),
  
      // // property_values: $ => prec.right(repeat1(seq($.property_value, ','))),

      // property_values: $ => seq($.property_value, repeat(seq(';', $.property_value))),

      // // property_values: $ => prec.right(seq($.property_value, repeat(seq(';', $.property_value)))),
  
      // property_value: $ => choice(
      //   $._STRINGCONSTANTWITHOUTEQ,
      //   $._CHARCONSTANTWOEQ,
      //   $._INTCONSTANT,
      //   $._REALCONSTANT,
      //   'true',
      //   'false',
      //   $._NAME
      // ),
  
      // property_literal: $ => repeat1(choice(
      //   $.COMMONCHAR,
      //   $._STRINGCONSTANTWITHOUTEQ
      // )),
  
      _NAME: $ => /[a-zA-Z_][a-zA-Z0-9_]*/,
      _INTCONSTANT: $ => /0[xX][0-9a-fA-F]+|[0-9]+/,
      _REALCONSTANT: $ => /[0-9]*\.[0-9]+([eE][+-]?[0-9]+)?/,
      _CHARCONSTANT: $ => /'[^']'/,
      _CHARCONSTANTWOEQ: $ => /'[^=']'/,
      _STRINGCONSTANT: $ => /"([^"\\]|\\.)*"/,
      _STRINGCONSTANTWITHOUTEQ: $ => /"([^="\\]|\\.)*"/,
      // PROP_NAME: $ => /[a-zA-Z_][a-zA-Z0-9_:.-]*/,
      // PROPERTYPARAMETER: $ => /[a-zA-Z_][a-zA-Z0-9_:.-]*/,
      // COMMONCHAR: $ => /[^\{\}=,;]/,
      // _commentlineLINE: $ => /\/\/[^\n]*/,
      _EMPTYLINE: $ => /\r?\n\s*\r?\n\s*/,
    }
  });
  