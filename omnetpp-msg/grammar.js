// grammar.js
module.exports = grammar({
    name: 'msg',

    extras: $ => [
        /\s/,
        $.comment
    ],
    
    rules: {

      msg_file: $ => repeat(choice(
        $.comment_block,
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

      comment: $ => token(seq('//', /[^\n]*/)),

      // comment_block: $ => repeat1($.comment),
      comment_block: $ => prec.right(seq(
        $.comment,
        repeat(seq(
          '\n',
          $.comment
        )),
        optional('\n')
      )),
  
      namespace_decl: $ => seq('namespace', optional($.qname), ';'),  // FIXME qname is optional???
  
      qname: $ => seq(optional('::'), $.NAME, repeat(seq('::', $.NAME))),
    
      fileproperty: $ => seq($.property_namevalue, ';'),
  
      cplusplus: $ => seq('cplusplus', optional(seq('(', $.targetspec, ')')), $.CPLUSPLUSBODY, optional(';')),
  
      targetspec: $ => seq($.targetitem, repeat($.targetitem)),
  
      targetitem: $ => choice($.NAME, '::', $.INTCONSTANT, ':', '.', ',', '~', '=', '&'),
  
      import: $ => seq('import', $.importspec, ';'),
  
      importspec: $ => seq($.importname, repeat(seq('.', $.importname))),
  
      importname: $ => choice($.NAME, 'message', 'packet', 'class', 'struct', 'enum', 'abstract'),
  
      struct_decl: $ => seq('struct', $.qname, ';'),
  
      class_decl: $ => seq('class', optional('noncobject'), $.qname, optional(seq('extends', $.qname)), ';'),
          
      message_decl: $ => seq('message', $.qname, ';'),
  
      packet_decl: $ => seq('packet', $.qname, ';'),
  
      enum_decl: $ => seq('enum', $.qname, ';'),
  
      enum: $ => seq('enum', $.qname, '{', repeat($.enumfield_or_property), '}', optional(';')),
    
      enumfield_or_property: $ => choice($.enumfield, $.property),
  
      enumfield: $ => seq($.NAME, optional(seq('=', $.enumvalue)), ';'),
  
      enumvalue: $ => choice($.INTCONSTANT, seq('-', $.INTCONSTANT), $.NAME),
  
      message: $ => seq($.message_header, $.body),
  
      packet: $ => seq($.packet_header, $.body),
  
      class: $ => seq($.class_header, $.body),
  
      struct: $ => seq($.struct_header, $.body),
  
      message_header: $ => seq('message', $.qname, optional(seq('extends', $.qname))),
  
      packet_header: $ => seq('packet', $.qname, optional(seq('extends', $.qname))),
  
      class_header: $ => seq('class', $.qname, optional(seq('extends', $.qname))),
  
      struct_header: $ => seq('struct', $.qname, optional(seq('extends', $.qname))),
  
      body: $ => seq('{', repeat(choice($.field, $.property)), '}', optional(';')),
  
      field: $ => choice(
        seq($.fieldtypename, optional($.opt_fieldvector), optional($.inline_properties), ';'),
        seq($.fieldtypename, optional($.opt_fieldvector), optional($.inline_properties), '=', $.fieldvalue, optional($.inline_properties), ';')
      ),
  
      fieldtypename: $ => seq(optional('abstract'), optional($.fielddatatype), $.NAME),
    
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
        $.NAME,
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
        seq('enum', '(', $.NAME, ')')
      ),
  
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
        $.NAME
      ),
  
      property_literal: $ => repeat1(choice(
        $.COMMONCHAR,
        $.STRINGCONSTANT
      )),
  
      NAME: $ => /[a-zA-Z_][a-zA-Z0-9_]*/,
      INTCONSTANT: $ => /0[xX][0-9a-fA-F]+|[0-9]+/,
      REALCONSTANT: $ => /[0-9]*\.[0-9]+([eE][+-]?[0-9]+)?/,
      CHARCONSTANT: $ => /'[^']'/,
      STRINGCONSTANT: $ => /"([^"\\]|\\.)*"/,
      PROPNAME: $ => /[a-zA-Z_][a-zA-Z0-9_:.-]*/,
      CPLUSPLUSBODY: $ => /\{\{[^\}]*\}\}/,
      COMMONCHAR: $ => /[^\{\}=,;]/
    }
  });
  