module.exports = grammar({
  name: 'ned',

  extras: $ => [
    /\s/,
    $.comment,
  ],

  rules: {
    source_file: $ => repeat($._definition),

    _definition: $ => prec.left(choice(
      $.module_definition,
      $.simple_module_definition,
      $.network_definition,
      $.channel_definition,
      $.parameters_block,
      $.gates_block,
      $.submodules_block,
      $.connections_block,
    )),

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

    parameters_block: $ => seq(
      'parameters:', 
      repeat(choice($.parameter, $.property))
    ),

    // parameter: $ => seq(
    //   $.identifier, '=', $.expression, ';'
    // ),

    parameter: $ => seq(optional(alias($.identifier, $.type)), $.identifier, optional(seq('=', $.expression)), ';'),

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
      optional($.parameters_block), 
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
