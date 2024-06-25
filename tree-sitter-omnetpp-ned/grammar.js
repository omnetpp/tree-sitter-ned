module.exports = grammar({
  name: 'ned',

  extras: $ => [
    /\s/,
    $.comment,
  ],

  rules: {
    source_file: $ => repeat($._definition),

    _definition: $ => prec.left(choice(
      $.package_decl,
      $.import,
      // $.property_decl,
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
  
    _importname: $ => choice($.identifier),

    // block: $ => choice(
    //   $.opt_paramblock,
    //   $.opt_gateblock,
    //   $.submodules_block,
    //   $.connections_block,
    //   $.types_block
    // ),

    module_definition: $ => seq(
      'module', alias($.identifier, $.name), optional(seq('like', alias($.identifier, $.like_name))), '{', 
      repeat($._definition), 
      '}'
    ),

    simple_module_definition: $ => seq(
      'simple', $.identifier, '{', 
      repeat($._definition), 
      '}'
    ),

    network_definition: $ => seq(
      'network', $.identifier, '{', 
      repeat($._definition), 
      '}'
    ),

    channel_definition: $ => seq(
      'channel', $.identifier, '{', 
      repeat($._definition), 
      '}'
    ),

    parameters_block: $ => prec.left(seq(
      'parameters:', 
      repeat(choice($.parameter, $.parameter_decl, $.property))
    )),

    types_block: $ => prec.left(seq(
      'types:', 
      repeat(choice($.channel_definition, $.simple_module_definition, $.module_definition, $.network_definition)) // TODO channelinterfacedefinition moduleinterfacedefinition ;
    )),

    // parameter: $ => seq(
    //   $.identifier, '=', $.expression, ';'
    // ),

    parameter: $ => prec.left(10, seq(repeat(seq($.parameter_id, '.')), $.parameter_id, seq('=', $.expression), ';')),

    parameter_decl: $ => prec.left(seq((alias($.identifier, $.type), $.identifier, ';'))),

    property: $ => seq('@', $.identifier, optional(seq('(', $.string_constant, ')')), ';'),

    gates_block: $ => seq(
      'gates:',
      repeat($._gate)
    ),

    _gate: $ => seq(
      $.identifier, ':', $.identifier, ';'
    ),

    submodules_block: $ => seq(
      'submodules:', 
      repeat($._submodule)
    ),

    _submodule: $ => seq(
      $.identifier, ':', $.identifier, '{', 
      // optional($.opt_paramblock), 
      '}'
    ),

    connections_block: $ => seq(
      'connections:', 
      repeat($._connection), 
    ),

    _connection: $ => seq(
      $.identifier, '->', $.identifier, ';'
    ),

    expression: $ => prec.left(choice(
      $.identifier,
      $.int_constant,
      $.real_constant,
      $.string_constant,
      $.char_constant,
      seq('(', $.expression, ')'),
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
