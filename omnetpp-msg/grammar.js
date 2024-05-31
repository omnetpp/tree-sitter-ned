// grammar.js
module.exports = grammar({
    name: 'msg',

    // extras: $ => [
    //     /\s/,
    //     // $.comment
    // ],
    
    rules: {

      msg_file: $ => repeat(choice(
        $.comment_block,
        $._EMPTYLINE,
        $.namespace_decl,
        $.fileproperty,
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

      // comment: $ => token(seq('//', /[^\n]*/)),

      // comment_block: $ => prec.right(seq(repeat1($._COMMENTLINE), optional('\n'))),   works
      // comment_block: $ => prec.right(seq(repeat1(seq($._COMMENTLINE, '\n')), $._COMMENTLINE)),   works kind of
      comment_block: $ => prec.right(repeat1($._COMMENTLINE)),   // best so far
      // comment_block: $ => prec.right(seq(
      //   $.comment,
      //   repeat(seq(
      //     '\n',
      //     $.comment
      //   )),
      //   optional('\n')
      // )),
  
      namespace_decl: $ => seq('namespace', optional($.qname), ';'),  // FIXME qname is optional???
  
      qname: $ => seq(optional('::'), $._NAME, repeat(seq('::', $._NAME))),
    
      fileproperty: $ => seq($.property_namevalue, ';'),
  
      cplusplus: $ => seq('cplusplus', optional(seq('(', $.targetspec, ')')), '{{', $.cplusplusbody, '}}', optional(';')),

      // cplusplusbody: $ => $._CPLUSPLUSBODY,

      cplusplusbody: $ => repeat1(choice(/[^{}]+/, $.cplusplusbracedblock)),

      cplusplusbracedblock: $ => seq('{', repeat(choice(/[^{}]+/)), '}'),
  
      targetspec: $ => seq($.targetitem, repeat($.targetitem)),
  
      targetitem: $ => choice($._NAME, '::', $.INTCONSTANT, ':', '.', ',', '~', '=', '&'),
  
      import: $ => seq('import', $.importspec, ';'),
  
      importspec: $ => seq($.importname, repeat(seq('.', $.importname))),
  
      importname: $ => choice($._NAME, 'message', 'packet', 'class', 'struct', 'enum', 'abstract'),
  
      struct_decl: $ => seq('struct', $.qname, ';'),
  
      class_decl: $ => seq('class', optional('noncobject'), $.qname, optional(seq('extends', $.qname)), ';'),
          
      message_decl: $ => seq('message', $.qname, ';'),
  
      packet_decl: $ => seq('packet', $.qname, ';'),
  
      enum_decl: $ => seq('enum', $.qname, ';'),
  
      enum: $ => seq('enum', $.qname, '{', repeat(choice($.enumfield_or_property, $.comment_block)), '}', optional(';')),
    
      enumfield_or_property: $ => prec.right(seq(choice($.enumfield, $.property), optional($.comment_block))),
  
      enumfield: $ => seq($._NAME, optional(seq('=', $.enumvalue)), ';'),
  
      enumvalue: $ => choice($.INTCONSTANT, seq('-', $.INTCONSTANT), $._NAME),
  
      message: $ => seq($.message_header, $.body),
  
      packet: $ => seq($.packet_header, $.body),
  
      class: $ => seq($.class_header, $.body),
  
      struct: $ => seq($.struct_header, $.body),
  
      message_header: $ => seq('message', $.qname, optional(seq('extends', $.qname))),
  
      packet_header: $ => seq('packet', $.qname, optional(seq('extends', $.qname))),
  
      class_header: $ => seq('class', $.class_name, optional(seq('extends', $.class_extend_name))),

      class_name: $ => prec.left($.qname),

      class_extend_name: $ => $.qname,
  
      struct_header: $ => seq('struct', $.qname, optional(seq('extends', $.qname))),
  
      body: $ => seq('{', repeat(seq(choice($.field, $.property, $.comment_block), optional($.comment_block))), '}', optional(';')),
  
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
  
      inline_properties: $ => repeat1($.property_namevalue),
  
      property: $ => seq($.property_namevalue, ';'),
  
      property_namevalue: $ => choice(
        $.property_name,
        seq($.property_name, '(', optional($.property_keys), ')'),
        seq('enum', '(', $._NAME, ')'),
        // seq($.property_name, '(', optional(choice($.PROPERTYPARAMETER, optional($.propertyparameter_parenthesizedblock))), ')')
      ),

      // propertyparameter_parenthesizedblock: $ => seq('(', optional($.PROPERTYPARAMETER), ')'),
  
      property_name: $ => choice(
        seq('@', $.PROPNAME),
        seq('@', $.PROPNAME, '[', $.PROPNAME, ']')
      ),
  
      property_keys: $ => repeat1($.property_key),
  
      property_key: $ => choice(
        seq($.property_literal, '=', $.property_values),
        $.property_values
      ),
  
      property_values: $ => prec.right(repeat1(seq($.property_value, ','))),
  
      property_value: $ => choice(
        $.STRINGCONSTANT,
        $.CHARCONSTANT,
        $.INTCONSTANT,
        $.REALCONSTANT,
        'true',
        'false',
        $._NAME
      ),
  
      property_literal: $ => repeat1(choice(
        $.COMMONCHAR,
        $.STRINGCONSTANT
      )),
  
      _NAME: $ => /[a-zA-Z_][a-zA-Z0-9_]*/,
      INTCONSTANT: $ => /0[xX][0-9a-fA-F]+|[0-9]+/,
      REALCONSTANT: $ => /[0-9]*\.[0-9]+([eE][+-]?[0-9]+)?/,
      CHARCONSTANT: $ => /'[^']'/,
      STRINGCONSTANT: $ => /"([^"\\]|\\.)*"/,
      PROPNAME: $ => /[a-zA-Z_][a-zA-Z0-9_:.-]*/,
      PROPERTYPARAMETER: $ => /[a-zA-Z_][a-zA-Z0-9_:.-]*/,
      _CPLUSPLUSBODY: $ => /\{\{[^\}\}]*\}\}/,
      _CPLUSPLUSBODYWITHOUTBRACES: $ => /[^\n;]*/,
      // _CPLUSPLUSBODY: $ => /\{\{(\s|\S)*?\}\}/,
      COMMONCHAR: $ => /[^\{\}=,;]/,
      // _COMMENTLINE: $ => /\/\/[^\n]*\n?/    works but contains a \n
      _COMMENTLINE: $ => /\/\/[^\n]*/,
      _EMPTYLINE: $ => /\r?\n\s*\r?\n/
    }
  });
  