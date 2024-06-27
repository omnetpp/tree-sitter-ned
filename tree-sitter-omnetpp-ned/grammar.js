module.exports = grammar({
  name: 'ned',

  extras: $ => [
    /\s/,
    $.comment,
  ],

  rules: {
    source_file: $ => repeat($.definition),

    definition: $ => prec.left(10, choice(
      $.package_decl,
      $.import,
      // $.property_decl,
      $.property,
      // $.fileproperty,
      $.channel_definition,
      // $.channelinterface_definition,
      $.simple_module_definition,
      $.module_definition,
      $.network_definition,
      // $.moduleinterface_definition,
    )),

    package_decl: $ => seq('package', alias($.package_spec, $.qname), ';'),

    package_spec: $ => seq($.identifier, repeat(seq('.', $.identifier))),

    import: $ => seq('import', alias($.importspec, $.import_qname), ';'),

    importspec: $ => choice($.import_un_qname, seq(repeat(seq($._importname, '.')), $.import_un_qname)),

    import_un_qname: $ => $._importname,
  
    _importname: $ => choice($.identifier, '*', '**'),

    // recursive definition (without unqname)
    // import: $ => seq('import', alias($.importspec, $.import_qname), ';'),

    // importspec: $ => choice(seq($.importspec, '.', $._importname), $._importname),

    // // import_un_qname: $ => $._importname,
  
    // _importname: $ => choice(seq($._importname, $.identifier), seq($._importname, '*'), seq($._importname, '**'), $.identifier, '*', '**'),

    _block: $ => choice(
      $.paramblock,
      $.gate_block,
      $.submodules_block,
      $.connections_block,
      $.types_block
    ),

    module_definition: $ => prec.right(seq(
      'module', alias($.identifier, $.name), optional(seq('like', alias($.identifier, $.like_name))), '{', 
      // optional($.module_body),
      // repeat(choice($.definition, $.block)),
      repeat($._block), 
      '}'
    )),

    // module_body: $ => repeat1(choice($.definition, $.block)),

    simple_module_definition: $ => seq(
      'simple', $.identifier, '{', 
      repeat($.definition), 
      '}'
    ),

    network_definition: $ => seq(
      'network', $.identifier, '{', 
      repeat($.definition), 
      '}'
    ),

    channel_definition: $ => seq(
      'channel', $.identifier, '{', 
      repeat($.definition), 
      '}'
    ),

    // parameters_block: $ => prec.left(seq(
    //   'parameters:', 
    //   repeat(choice($.parameter, $.parameter_decl, $.property))
    // )),

    paramblock: $ => prec.right( 
      seq(optional('parameters:'), $.params)
    ),

    params: $ => choice(
      seq($.params, $.paramsitem, ';'),
      seq($.paramsitem, ';')
    ),

    paramsitem: $ => choice(
      $.param,
      $.inline_properties
    ),

    param: $ => choice(
      $.param_typenamevalue,
      $.pattern_value
    ),

    param_typenamevalue: $ => choice(
      seq($.param_typename, optional($.inline_properties)),
      seq($.param_typename, optional($.inline_properties), '=', $.paramvalue, optional($.inline_properties))
    ),

    param_typename: $ => choice(
      seq(optional('volatile'), $.paramtype, $.identifier),
      $.identifier
    ),

    pattern_value: $ => seq(
      $.pattern,
      '=',
      $.paramvalue,
    ),

    paramtype: $ => choice(
      'double',
      'int',
      'string',
      'bool',
      'object',
      'xml'
    ),

    paramvalue: $ => choice(
      $.expression,
      seq('default', '(', $.expression, ')'),
      'default',
      'ask'
    ),

    inline_properties: $ => prec(10, choice(
      // seq($.inline_properties, $.property_namevalue),
      // $.property_namevalue
      seq('@', $.identifier, optional(seq('(', $.string_constant, ')'))),
    )),
    
    pattern: $ => choice(
      seq($.pattern2, '.', $.pattern_elem),
      seq($.pattern2, '.', 'typename')
    ),
    
    pattern2: $ => choice(
      seq($.pattern2, '.', $.pattern_elem),
      $.pattern_elem
    ),
    
    pattern_elem: $ => choice(
      seq($.pattern_name, '[', $.pattern_index, ']'),
      seq($.pattern_name, '[', '*', ']'),
      '**',
      $.pattern_name
    ),
    
    pattern_name: $ => prec.left(choice(
      seq($.identifier, '$', $.identifier),
      $.identifier,
      'channel',
      seq('{', $.pattern_index, '}'),
      '*',
      seq($.pattern_name, $.identifier),
      seq($.pattern_name, '{', $.pattern_index, '}'),
      seq($.pattern_name, '*')
    )),
    
    pattern_index: $ => choice(
      $.int_constant,
      seq($.int_constant, '..', $.int_constant),
      seq('..', $.int_constant),
      seq($.int_constant, '..')
    ),

    types_block: $ => prec.left(10, seq(
      'types:', 
      repeat(choice($.channel_definition, $.simple_module_definition, $.module_definition, $.network_definition)) // TODO channelinterfacedefinition moduleinterfacedefinition ;
    )),

    // parameter: $ => seq(
    //   $.identifier, '=', $.expression, ';'
    // ),

    // parameter: $ => prec.left(10, seq(repeat(seq($.parameter_id, '.')), $.parameter_id, seq('=', $.expression), ';')),

    // parameter_decl: $ => prec.left(seq((alias($.identifier, $.type), $.identifier, ';'))),

    property: $ => seq('@', $.identifier, optional(seq('(', $.string_constant, ')')), ';'),

    gate_block: $ => prec.right(seq(
      'gates:',
      repeat($.gate)
    )),

    gate: $ => seq(
      $.identifier, $.identifier, ';'
    ),

    submodules_block: $ => prec.right(seq(
      'submodules:', 
      repeat($.submodule)
    )),

    // _submodule: $ => seq(
    //   $.identifier, ':', $.identifier, '{', 
    //   // optional($.opt_paramblock), 
    //   '}'
    // ),

    // submodule: $ => choice(seq($.submoduleheader, ';'), seq($.submoduleheader, $.opt_paramblock, $.opt_gateblock, '}', optional(';'), ';')),

    dottedname: $ => choice(
      seq($.dottedname, '.', $.identifier),
      $.identifier
    ),

    condition: $ => seq('if', $.expression, optional(seq($.operator, $.expression))),

    operator: $ => /[=!<>][=!<>]/,

    vector: $ => seq('[', $.expression, ']'),

    submodule: $ => choice(
      seq($.submoduleheader, ';'),
      seq(
        $.submoduleheader,
        '{',
        optional($.paramblock),
        optional($.gate_block),
        '}',
        optional(';'),
      )
    ),

    submoduleheader: $ => choice(
      seq(
        $.submodulename,
        ':',
        $.dottedname,
        optional($.condition)
      ),
      seq(
        $.submodulename,
        ':',
        $.likeexpr,
        'like',
        $.dottedname,
        optional($.condition)
      )
    ),

    submodulename: $ => choice(
      $.identifier,
      seq($.identifier, $.vector)
    ),

    likeexpr: $ => choice(
      seq('<', '>'),
      seq('<', $.expression, '>'),
      seq('<', 'default', '(', $.expression, ')', '>')
    ),

    connections_block: $ => prec.right(seq(
      'connections',
      optional('allowunconnected'),
      ':', 
      repeat($.connection), 
    )),

    connection: $ => seq(
      $.dottedname, '-->', $.dottedname, optional($.condition), ';'
    ),

    expression: $ => prec.left(choice(
      $.identifier,
      $.int_constant,
      $.real_constant,
      $.string_constant,
      $.char_constant,
      seq('(', $.expression, ')'),
      seq($.expression, '(', $.expression, ')'),
      seq($.expression, '+', $.expression),
      seq($.expression, '-', $.expression),
      seq($.expression, '*', $.expression),
      seq($.expression, '/', $.expression)
    )),

    identifier: $ => /[a-zA-Z_][a-zA-Z0-9_]*/,
    parameter_id: $ => /[a-zA-Z0-9_*]*/,
    int_constant: $ => /\d+/,
    real_constant: $ => /\d+\.\d+/,
    string_constant: $ => /"([^"\\;]|\\.)*"/,
    char_constant: $ => /'([^'\\;]|\\.)'/,

    comment: $ => token(choice(
      seq('//', /.*/),
      seq('/*', /[^*]*\*+([^/*][^*]*\*+)*/, '/')
    )),
  }
});
