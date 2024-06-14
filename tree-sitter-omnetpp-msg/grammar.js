// grammar.js
module.exports = grammar({
    name: 'msg',

    extras: $ => [
        /\s/,
        $._commentline
    ],

    supertypes: $ => [
      $._targetitem
    ],

    conflicts: $ => [
      [$.prop_cpp, $.prop_keyvaluepair, $.prop_value]
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
  
      namespace: $ => seq('namespace', optional(alias($.qname, $.name)), ';'),  // FIXME qname is optional???
  
      qname: $ => seq(optional('::'), $.NAME, repeat(seq('::', $.NAME))),
  
  
      targetspec: $ => seq($._targetitem, repeat($._targetitem)),
  
      _targetitem: $ => choice($.NAME, '::', $._INTCONSTANT, ':', '.', ',', '~', '=', '&'),
  
      import: $ => seq('import', $.importspec, ';'),
  
      // importspec: $ => seq($._importname, repeat(seq('.', $._importname))),

      importspec: $ => choice($.import_unqname, seq(repeat(seq($._importname, '.')), $.import_unqname)),

      import_unqname: $ => $._importname,
  
      _importname: $ => choice($.NAME, 'message', 'packet', 'class', 'struct', 'enum', 'abstract'),
  
      struct_decl: $ => seq('struct', alias($.qname, $.name), ';'),
  
      class_decl: $ => seq('class', optional('noncobject'), alias($.qname, $.name), optional(seq('extends', alias($.qname, $.extendsNAME))), ';'),
          
      message_decl: $ => seq('message', alias($.qname, $.name), ';'),
  
      packet_decl: $ => seq('packet', alias($.qname, $.name), ';'),
  
      enum_decl: $ => seq('enum', alias($.qname, $.name), ';'),
  
      enum: $ => prec(10, seq(optional($.comment), 'enum', alias($.qname, $.name), '{', alias(repeat(choice($._enumfield_or_property, $.comment, $._EMPTYLINE)), $.source_code), '}', optional(';'))),
    
      _enumfield_or_property: $ => prec.right(seq(choice($.enumfield, $.property), optional($.comment))),
  
      enumfield: $ => seq(alias($.NAME, $.name), optional(seq('=', alias($.enumvalue, $.value))), ';', optional($.inline_comment)),
  
      enumvalue: $ => choice($._INTCONSTANT, seq('-', $._INTCONSTANT), $.NAME),
  
      message: $ => prec(10, seq(optional($.comment), $._message_header, alias($._body, $.source_code))),
  
      packet: $ => prec(10, seq(optional($.comment), $._packet_header, alias($._body, $.source_code))),
  
      class: $ => prec(10, seq(optional($.comment), $._class_header, $._body)),
  
      struct: $ => prec(10, seq(optional($.comment), $._struct_header, alias($._body, $.source_code))),
  
      _message_header: $ => seq('message', alias($.qname, $.name), optional(seq('extends', alias($.qname, $.extendsNAME)))),
  
      _packet_header: $ => seq('packet', $.qname, optional(seq('extends', $.qname))),
  
      _class_header: $ => seq('class', alias(prec.left($.qname), $.name), optional(seq('extends', alias($.qname, $.extendsNAME)))),
  
      _struct_header: $ => seq('struct', alias($.qname, $.name), optional(seq('extends', alias($.qname, $.extendsNAME)))),
  
      _body: $ => seq('{', alias(repeat(seq(choice($.field, $.property, $.comment), optional($.comment))), $.source_code), '}', optional(';')),
  
      field: $ => choice(
        seq($._fieldtypename, optional($.opt_fieldvector), optional($.inline_properties), ';', optional($.inline_comment)),
        seq($._fieldtypename, optional($.opt_fieldvector), optional($.inline_properties), '=', alias($.fieldvalue, $.value), optional($.inline_properties), ';', optional($.inline_comment)),
      ),

      inline_comment: $ => token.immediate((seq(/[^\n\/]*/, '//', /[^\n]*/))),
  
      _fieldtypename: $ => seq(optional('abstract'), alias(optional($._fielddatatype), $.data_type), alias($.NAME, $.name)),
    
      _fielddatatype: $ => choice(
        $._fieldsimpledatatype,
        seq($._fieldsimpledatatype, '*'),
        seq('const', $._fieldsimpledatatype),
        seq('const', $._fieldsimpledatatype, '*')
      ),
  
      _fieldsimpledatatype: $ => choice(
        $.qname,
        'char', 'short', 'int', 'long',
        seq('unsigned', 'char'),
        seq('unsigned', 'short'),
        seq('unsigned', 'int'),
        seq('unsigned', 'long'),
        'double', 'string', 'bool'
      ),
  
      opt_fieldvector: $ => choice(
        seq('[', $._INTCONSTANT, ']'),
        seq('[', $.qname, ']'),
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
        $.NAME,
        '::',
        '?', ':', '&&', '||', '##', '==', '!=', '>', '>=', '<', '<=',
        '&', '|', '#', '<<', '>>',
        '+', '-', '*', '/', '%', '^', '!', '~',
        '.', ',', '(', ')', '[', ']'
      ),

      property: $ => seq('@', $.prop_body, ';', optional($.inline_comment)),

      prop_body: $ => seq(alias($.NAME, $.name), optional(seq('[', alias($.NAME, $.index),']')), optional($.prop_parenthesized)),

      prop_parenthesized: $ => prec.right(seq('(', alias($.prop_value, $.value), ')')),
      
      prop_value: $ => prec.right(seq($.property_tag, repeat(seq(';', $.property_tag)))),

      prop_cpp: $ => alias(repeat1(choice(
        // $._cplusplus_braced_content,
        // $._cplusplus_string_literal,
        /[^\(\)=;]+/,
        $.cplusplus_parenthesized_prop,
      )), $.cplusplus__body),

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

      cplusplus_parenthesized_prop: $ => seq(
        '(',
        repeat(choice(
          // $._cplusplus_braced_content,
          // $._cplusplus_string_literal,
          $.cplusplus_parenthesized_prop,
          /[^\(\);=]/
        )),
        ')'
      ),

      property_tag: $ => choice(
        prec(10, alias($.NAME, $.prop_value)),
        prec(100, $.prop_keyvaluepair),
        prec(0, $.prop_cpp),
        prec(10, $._INTCONSTANT)
      ),

      prop_keyvaluepair: $ => seq(alias($.NAME, $.name), '=', alias(/[^@;\(\)=]*/, $.value)),
  
      inline_properties: $ => repeat1(seq('@', $.prop_body)),
  
      // propertyNAMEvalues: $ => seq($.propertyNAMEvalue, ';'),

      // propertyNAMEvalues: $ => prec.right(seq($.propertyNAMEvalue, repeat(seq(';', $.propertyNAMEvalue)))),
  
      // propertyNAMEvalue: $ => choice(
      //   $.propertyNAME,
      //   seq($.propertyNAME, '(', optional($.property_keys), ')'),
      //   seq('enum', '(', $.NAME, ')'),
      //   // seq($.propertyNAME, '(', optional(choice($.PROPERTYPARAMETER, optional($.propertyparameter_parenthesizedblock))), ')')
      // ),

      // // propertyparameter_parenthesizedblock: $ => seq('(', optional($.PROPERTYPARAMETER), ')'),
  
      // propertyNAME: $ => choice(
      //   seq('@', $.PROPNAME),
      //   seq('@', $.PROPNAME, '[', $.PROPNAME, ']')
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
      //   $.NAME
      // ),
  
      // property_literal: $ => repeat1(choice(
      //   $.COMMONCHAR,
      //   $._STRINGCONSTANTWITHOUTEQ
      // )),
  
      NAME: $ => /[a-zA-Z_][a-zA-Z0-9_]*/,
      _INTCONSTANT: $ => /0[xX][0-9a-fA-F]+|[0-9]+/,
      _REALCONSTANT: $ => /[0-9]*\.[0-9]+([eE][+-]?[0-9]+)?/,
      _CHARCONSTANT: $ => /'[^']'/,
      _CHARCONSTANTWOEQ: $ => /'[^=']'/,
      _STRINGCONSTANT: $ => /"([^"\\]|\\.)*"/,
      _STRINGCONSTANTWITHOUTEQ: $ => /"([^="\\]|\\.)*"/,
      PROPNAME: $ => /[a-zA-Z_][a-zA-Z0-9_:.-]*/,
      PROPERTYPARAMETER: $ => /[a-zA-Z_][a-zA-Z0-9_:.-]*/,
      COMMONCHAR: $ => /[^\{\}=,;]/,
      // _commentlineLINE: $ => /\/\/[^\n]*/,
      _EMPTYLINE: $ => /\r?\n\s*\r?\n/,
    }
  });
  