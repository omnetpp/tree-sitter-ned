// grammar.js
module.exports = grammar({
    name: 'msg',

    extras: $ => [
        /\s/,
        $._commentline
    ],

    // externals: $ => [
    //   $.cplusplus_block
    // ],

    // extras: $ => [],
    
    rules: {

      msg_file: $ => repeat(choice(
        // $.cplusplus_block,
        $.comment,
        $.EMPTYLINE,
        $.namespace,
        // $.property,
        $.prop,
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

      // cplusplus_block: $ => $.cplusplus_block,

      cplusplus: $ => seq(
        'cplusplus',
        optional(seq('(', alias($.targetspec, $.cplusplus_target), ')')),
        '{{',
        alias(repeat(choice(
          $.cplusplus_braced_content,
          $.cplusplus_string_literal,
          /[^{}]/
        )), $.cplusplus_body),
        '}}',
        optional(';')
      ),
  
      cplusplus_braced_content: $ => seq(
        '{',
        repeat(choice(
          $.cplusplus_braced_content,
          $.cplusplus_string_literal,
          /[^{}]/
        )),
        '}'
      ),
  
      cplusplus_string_literal: $ => choice(
        seq('"', repeat(choice(/[^"\\]/, /\\./)), '"'),
        seq("'", repeat(choice(/[^'\\]/, /\\./)), "'")
      ),

      // comment: $ => token(seq('//', /[^\n]*/)),

      // comment: $ => prec.right(seq(repeat1($._commentlineLINE), optional('\n'))),   works
      // comment: $ => prec.right(seq(repeat1(seq($._commentlineLINE, '\n')), $._commentlineLINE)),   works kind of
      comment: $ => prec.right(repeat1($._commentline)),   // best so far
      // comment: $ => prec.right(seq(
      //   $.comment,
      //   repeat(seq(
      //     '\n',
      //     $.comment
      //   )),
      //   optional('\n')
      // )),

      _commentline: _ => token(choice(
        seq('//', /(\\+(.|\r?\n)|[^\\\n])*/),
        seq(
          '/*',
          /[^*]*\*+([^/*][^*]*\*+)*/,
          '/',
        ),    // TODO is that needed in msg files?
      )),
  
      namespace: $ => seq('namespace', optional(alias($.qname, $.namespace_name)), ';'),  // FIXME qname is optional???
  
      qname: $ => seq(optional('::'), $._NAME, repeat(seq('::', $._NAME))),
    
      // property: $ => seq($.property_namevalue, ';'),
  
      // cplusplus: $ => seq('cplusplus', optional(seq('(', $.targetspec, ')')), '{{', $.cplusplusbody, '}}', optional(';')),

      // cplusplustext: $ => /[\s|\S]*?/,

      // cplusplustext: $ => repeat1(/[^\n]*?/),

      // cplusplustext: $ => /[^\}\}].*?/,

      // cplusplusbody: $ => repeat1(choice(/[^{}]+/, $._cplusplusbracedblock)),

      // _cplusplusbracedblock: $ => seq('{', repeat(choice(/[^{}]+/, $._cplusplusbracedblock)), '}'),
  
      targetspec: $ => seq($.targetitem, repeat($.targetitem)),
  
      targetitem: $ => choice($._NAME, '::', $.INTCONSTANT, ':', '.', ',', '~', '=', '&'),
  
      import: $ => seq('import', $.importspec, ';'),
  
      importspec: $ => seq($.importname, repeat(seq('.', $.importname))),
  
      importname: $ => choice($._NAME, 'message', 'packet', 'class', 'struct', 'enum', 'abstract'),
  
      struct_decl: $ => seq('struct', alias($.qname, $.struct_name), ';'),
  
      class_decl: $ => seq('class', optional('noncobject'), alias($.qname, $.class_name), optional(seq('extends', alias($.qname, $.class_extends_name))), ';'),
          
      message_decl: $ => seq('message', alias($.qname, $.message_name), ';'),
  
      packet_decl: $ => seq('packet', alias($.qname, $.packet_name), ';'),
  
      enum_decl: $ => seq('enum', alias($.qname, $.enum_name), ';'),
  
      enum: $ => seq('enum', alias($.qname, $.enum_name), '{', alias(repeat(choice($.enumfield_or_property, $.comment)), $.enum_source_code), '}', optional(';')),
    
      enumfield_or_property: $ => prec.right(seq(choice($.enumfield, $.prop), optional($.comment))),
  
      enumfield: $ => seq($._NAME, optional(seq('=', $.enumvalue)), ';'),
  
      enumvalue: $ => choice($.INTCONSTANT, seq('-', $.INTCONSTANT), $._NAME),
  
      message: $ => seq($._message_header, alias($.body, $.message_source_code)),
  
      packet: $ => seq($._packet_header, alias($.body, $.packet_source_code)),
  
      class: $ => seq($._class_header, alias($.body, $.class_source_code)),
  
      struct: $ => seq($._struct_header, alias($.body, $.struct_source_code)),
  
      _message_header: $ => seq('message', alias($.qname, $.message_name), optional(seq('extends', alias($.qname, $.message_extends_name)))),
  
      _packet_header: $ => seq('packet', $.qname, optional(seq('extends', $.qname))),
  
      _class_header: $ => seq('class', alias(prec.left($.qname), $.class_name), optional(seq('extends', alias($.qname, $.class_extends_name)))),
  
      _struct_header: $ => seq('struct', alias($.qname, $.struct_name), optional(seq('extends', alias($.qname, $.struct_extends_name)))),
  
      body: $ => seq('{', repeat(seq(choice($.field, $.prop, $.comment), optional($.comment))), '}', optional(';')),
  
      field: $ => choice(
        seq($.fieldtypename, optional($.opt_fieldvector), optional($.inline_properties), ';'),
        seq($.fieldtypename, optional($.opt_fieldvector), optional($.inline_properties), '=', $.fieldvalue, optional($.inline_properties), ';')
      ),
  
      fieldtypename: $ => seq(optional('abstract'), optional($.fielddatatype), $._NAME),
    
      fielddatatype: $ => choice(
        $.fieldsimpledatatype,
        seq($.fieldsimpledatatype, '*'),
        seq('const', $.fieldsimpledatatype),
        seq('const', $.fieldsimpledatatype, '*')
      ),
  
      fieldsimpledatatype: $ => choice(
        $.qname,
        'char', 'short', 'int', 'long',
        seq('unsigned', 'char'),
        seq('unsigned', 'short'),
        seq('unsigned', 'int'),
        seq('unsigned', 'long'),
        'double', 'string', 'bool'
      ),
  
      opt_fieldvector: $ => choice(
        seq('[', $.INTCONSTANT, ']'),
        seq('[', $.qname, ']'),
        seq('[', ']')
      ),
  
      fieldvalue: $ => repeat1($.fieldvalueitem),
  
      fieldvalueitem: $ => choice(
        $.STRINGCONSTANT,
        $.CHARCONSTANT,
        $.INTCONSTANT,
        $.REALCONSTANT,
        'true',
        'false',
        $._NAME,
        '::',
        '?', ':', '&&', '||', '##', '==', '!=', '>', '>=', '<', '<=',
        '&', '|', '#', '<<', '>>',
        '+', '-', '*', '/', '%', '^', '!', '~',
        '.', ',', '(', ')', '[', ']'
      ),

      prop: $ => seq('@', $.prop_body),

      prop_body: $ => seq($._NAME, optional(seq('[', $._NAME,']')), optional($.prop_parenthesized), ';'),

      prop_parenthesized: $ => seq('(', /[^\(\)]*/, ')'),
  
      inline_properties: $ => repeat1($.prop),
  
      // property_namevalues: $ => seq($.property_namevalue, ';'),

      // property_namevalues: $ => prec.right(seq($.property_namevalue, repeat(seq(';', $.property_namevalue)))),
  
      // property_namevalue: $ => choice(
      //   $.property_name,
      //   seq($.property_name, '(', optional($.property_keys), ')'),
      //   seq('enum', '(', $._NAME, ')'),
      //   // seq($.property_name, '(', optional(choice($.PROPERTYPARAMETER, optional($.propertyparameter_parenthesizedblock))), ')')
      // ),

      // // propertyparameter_parenthesizedblock: $ => seq('(', optional($.PROPERTYPARAMETER), ')'),
  
      // property_name: $ => choice(
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
      //   $.STRINGCONSTANTWITHOUTEQ,
      //   $.CHARCONSTANTWOEQ,
      //   $.INTCONSTANT,
      //   $.REALCONSTANT,
      //   'true',
      //   'false',
      //   $._NAME
      // ),
  
      // property_literal: $ => repeat1(choice(
      //   $.COMMONCHAR,
      //   $.STRINGCONSTANTWITHOUTEQ
      // )),
  
      _NAME: $ => /[a-zA-Z_][a-zA-Z0-9_]*/,
      INTCONSTANT: $ => /0[xX][0-9a-fA-F]+|[0-9]+/,
      REALCONSTANT: $ => /[0-9]*\.[0-9]+([eE][+-]?[0-9]+)?/,
      CHARCONSTANT: $ => /'[^']'/,
      CHARCONSTANTWOEQ: $ => /'[^=']'/,
      STRINGCONSTANT: $ => /"([^"\\]|\\.)*"/,
      STRINGCONSTANTWITHOUTEQ: $ => /"([^="\\]|\\.)*"/,
      PROPNAME: $ => /[a-zA-Z_][a-zA-Z0-9_:.-]*/,
      PROPERTYPARAMETER: $ => /[a-zA-Z_][a-zA-Z0-9_:.-]*/,
      // _CPLUSPLUSBODY: $ => /\{\{[^\}]*\}\}/,
      // _CPLUSPLUSBODYWITHOUTBRACES: $ => /[^\n;]*/,
      // _CPLUSPLUSBODY: $ => /\{\{(\s|\S)*?\}\}/,
      COMMONCHAR: $ => /[^\{\}=,;]/,
      // _commentlineLINE: $ => /\/\/[^\n]*\n?/    works but contains a \n
      _commentlineLINE: $ => /\/\/[^\n]*/,
      EMPTYLINE: $ => /\r?\n\s*\r?\n/,
    }
  });
  