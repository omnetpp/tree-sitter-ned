module.exports = grammar({
  name: 'ned',

  extras: $ => [
    /\s/,
    $.inline_comment,
  ],

  conflicts: $ => [[$.dottedname, $.dottednamevector]],

  rules: {
    nedfile: $ => prec.right(repeat1(
      choice(
        $.comment,
        $.EMPTYLINE,
        $.package,
        $.import,
        $.property_decl,
        alias(seq(
          $.property_namevalue,
          ';'
        ), $.property),
        $.channel,
        $.channel_interface,
        $.simple_module,
        $.compound_module,
        $.network,
        $.module_interface,
        ';'
      )
    )),

    // definitions: $ => choice(
    //   seq($.definitions, $.definition),
    //   $.definition
    // ), 

    EMPTYLINE: $ => /\r?\n\s*\r?\n\s*/,
    
    // definition: $ => choice(
    //   $.comment,
    //   $.EMPTYLINE,
    //   $.package,
    //   $.import,
    //   $.property_decl,
    //   alias(seq(
    //     $.property_namevalue,
    //     ';'
    //   ), $.property),
    //   $.channel,
    //   $.channel_interface,
    //   $.simple_module,
    //   $.compound_module,
    //   $.network,
    //   $.module_interface,
    //   ';'
    // ),

    comment: $ => alias(prec.right(repeat1($._commentline)), $.content),

    _commentline: $ => token(
      seq('//', /(\\+(.|\r?\n)|[^\\\n])*/),
      // seq(
      //   '/*',
      //   /[^*]*\*+([^/*][^*]*\*+)*/,
      //   '/',
      // ),    // TODO is that needed in msg files? NO
    ),

    inline_comment: $ => $._commentline,
    

    package: $ => seq(
      'package',
      $.dottedname,
      ';'
    ),

    dottedname: $ => prec.right(seq($.NAME, repeat(seq('.', $.NAME)))),

    // import: $ => seq(
    //   'import',
    //   $.importspec,
    //   ';'
    // ),

    // importspec: $ => choice(
    //   seq($.importspec, '.', $.importname),
    //   $.importname
    // ),

    // importspec: $ => prec.right(seq($.importname, repeat(seq(',', $.importname)))),

    import: $ => seq('import', $.importspec, ';'),

    importspec: $ => choice($.import_un_qname, seq(repeat(seq($.importname, '.')), $.import_un_qname)),

    import_un_qname: $ => $.importname,
  
    // _importname: $ => choice($.NAME, 'message', 'packet', 'class', 'struct', 'enum', 'abstract'),

    // importname: $ => choice(
    //   seq($.importname, $.NAME),
    //   seq($.importname, '*'),
    //   seq($.importname, '**'),
    //   $.NAME,
    //   '*',
    //   '**'
    // ),

    importname: $ => repeat1(choice($.NAME, '*', '**')),

    property: $ => seq(
      $.property_namevalue,
      // ';'
    ),
    
    property_decl: $ => choice(
      seq($.property_decl_header, optional($.inline_properties), ';'),
      seq($.property_decl_header, '(', optional($.property_decl_keys), ')', optional($.inline_properties), ';')
    ),

    property_decl_header: $ => choice(
      seq('property', '@', $.NAME, '[', ']'),
      seq('property', '@', $.NAME)
    ),
    
    // property_decl_keys: $ => seq(
    //   choice($.property_decl_keys, $.property_decl_key),
    //   ';',
    //   $.property_decl_key
    // ),

    property_decl_keys: $ => seq($.property_decl_key, repeat(seq(';', $.property_decl_key))),

    property_decl_key: $ => $.property_literal,

    fileproperty: $ => seq(
      $.property_namevalue,
      ';'
    ),

    channel: $ => seq(
      $.channelheader,
      '{',
      optional($.parameters),
      '}'
    ),
    
    channelheader: $ => seq(
      'channel',
      $.NAME,
      optional($.inheritance)
    ),

    inheritance: $ => choice(      
      'extends',
      seq('like', $.likenames),
      seq('extends', $.extends),
      seq('extends', $.extends, 'like', $.likenames)
    ),
    
    extends: $ => $.dottedname,

    // likenames: $ => prec.left(choice(
    //   seq(
    //     $.likenames,
    //     ',',
    //     $.likename
    // ),
    // $.likename)),

    likenames: $ => seq($.likename, repeat(seq(',', $.likename))),

    likename: $ => $.dottedname,

    channel_interface: $ => seq(
      $.channelinterfaceheader,
      '{',
      optional($.parameters),
      '}'
    ),

    channelinterfaceheader: $ => seq(
      'channelinterface',
      $.NAME,
      optional($.interfaceinheritance)
    ),

    interfaceinheritance: $ => seq('extends', $.extendss),
    
    // extendss: $ => prec.left(choice(
    //   seq(
    //     $.extendss,
    //     ',',
    //     $.extends
    // ),
    // $.extends)),

    extendss: $ => seq($.extends, repeat(seq(',', $.extends))),

    simple_module: $ => seq(
      $.simplemoduleheader,
      '{',
      optional($.parameters),
      optional($.gates),
      '}'
    ),

    simplemoduleheader: $ => seq(
      'simple',
      $.NAME,
      optional($.inheritance)
    ),

    compound_module: $ => seq(
      $.compoundmoduleheader,
      '{',
      optional($.parameters),
      optional($.gates),
      optional($.types),
      optional($.submodules),
      optional($.connections),
      '}'
    ),

    compoundmoduleheader: $ => seq(
      'module',
      $.NAME,
      optional($.inheritance)
    ),

    network: $ => seq(
      $.networkheader,
      '{',
      optional($.parameters),
      optional($.gates),
      optional($.types),
      optional($.submodules),
      optional($.connections),
      '}'
    ),

    networkheader: $ => seq(
      'network',
      $.NAME,
      optional($.inheritance)
    ),

    module_interface: $ => seq(
      $.moduleinterfaceheader,
      '{',
      optional($.parameters),
      optional($.gates),
      '}'
    ),

    moduleinterfaceheader: $ => seq(
      'moduleinterface',
      $.NAME,
      optional($.interfaceinheritance)
    ),

    // parameters: $ => choice(
    //   seq(
    //     optional($.params),
    //     optional(
    //       seq(
    //         'parameters',
    //         ':',
    //         optional($.params)
    //       )
    //     )
    //   ),
    //   seq(
    //     'parameters',
    //     ':',
    //     optional($.params)
    //   )
    // ),

    parameters: $ => choice(
      $.params,
      seq('parameters:', $.params),
      'parameters:'
    ),

    // parameters: $ => seq(optional('parameters:'), $.params),

    // params: $ => choice(
    //   seq($.params, $.paramsitem),
    //   $.paramsitem
    // ),

    params: $ => repeat1($.paramsitem),

    paramsitem: $ => prec.right(10, seq(choice($.param, $.property), ';', optional($.comment))),

    // TODO opt_parameters: optional(params)
    
    param: $ => choice(
      $.param_typenamevalue,
      $.parampattern_value
    ),
    
    param_typenamevalue: $ => choice(
      seq(
        $.param_typename,
        optional($.inline_properties)
      ),
      seq(
        $.param_typename,
        optional($.inline_properties),
        '=',
        $.paramvalue,
        optional($.inline_properties)
      )
    ),

    param_typename: $ => choice(
      seq(
        optional('volatile'),
        $.paramtype,
        $.NAME
      ),
      $.NAME
    ),
    
    parampattern_value: $ => seq(
      $.parampattern,
      optional($.inline_properties),
      '=',
      $.paramvalue
    ),
    
    paramtype: $ => choice(
      'double',
      'int',
      'string',
      'bool',
      'object',
      'xml'
    ),
    
    // TODO opt_volatile -> 'volatile'
    
    paramvalue: $ => prec.right(choice(
      $.expression,
      seq('default', '(', $.expression, ')'),
      'default',
      'ask',
    )),
    
    // opt_inline_properties
    
    // inline_properties: $ => choice(
    //   $.property_namevalue,
    //   seq($.inline_properties, $.property_namevalue)
    // ),

    inline_properties: $ => repeat1($.property_namevalue),

    parampattern: $ => $.pattern,
    
    // pattern: $ =>
    //   choice(
    //     seq($.pattern2, '.', $.pattern_elem),
    //     seq($.pattern2, '.', 'typename')
    // ),

    // // pattern2: $ => choice(
    // //   seq($.pattern2, '.', $.pattern_elem),
    // //   $.pattern_elem
    // // ),

    // pattern2: $ => prec.right(seq($.pattern_elem, repeat(seq('.', $.pattern_elem)))),

    pattern: $ => seq(prec.right(seq($.pattern_elem, repeat(seq('.', $.pattern_elem)))), '.', choice($.pattern_elem, 'typename')),
    
    pattern_elem: $ => choice(
      seq($.pattern_name, '[', $.pattern_index, ']'),
      seq($.pattern_name, '[', '*', ']'),
      '**',
      $.pattern_name
    ),
    
    // pattern_name: $ => prec.left(choice(
    //   seq($.NAME, '$', $.NAME),
    //   $.NAME,
    //   'channel',
    //   seq('{', $.pattern_index, '}'),
    //   '*',
    //   seq($.pattern_name, $.NAME),
    //   seq($.pattern_name, '{', $.pattern_index, '}'),
    //   seq($.pattern_name, '*')
    // )),

    pattern_name: $ => prec.right(10, repeat1(choice(
      $.NAME,
      seq($.NAME, '$', $.NAME),
      'channel',
      seq('{', $.pattern_index, '}'),
      '*',
    ))),
    
    pattern_index: $ => choice(
      $.INTCONSTANT,
      seq($.INTCONSTANT, '..', $.INTCONSTANT),
      seq('..', $.INTCONSTANT),
      seq($.INTCONSTANT, '..')
    ),

    property_namevalue: $ =>
      choice(
        $.property_name,
        prec.right(seq($.property_name, '(', optional($.property_keys), ')'))
    ),
    
    property_name: $ =>
      prec.right(choice(
        seq('@', $.NAME),
        seq('@', $.NAME, '[', $.dottedname, ']'),
        seq('@', $.NAME, '[', $.INTCONSTANT, ']'),
    )),

    // optional($.property_keys)

    // property_keys: $ =>
    //   choice(
    //     seq($.property_keys, ';', $.property_key),
    //     $.property_key
    // ),

    property_keys: $ => seq($.property_key, repeat(seq(';', $.property_key)), optional(';')),

    property_key: $ =>
      prec.right(choice(
        seq(
          $.property_literal,
          '=',
          optional($.property_value)
        ),
          $.property_values,
      )),

    // property_values: $ =>
    //   prec.right(10, choice(
    //     seq($.property_values, optional(seq(',', $.property_value))),
    //     $.property_value
    // )),

    property_values: $ => prec.right(seq($.property_value, repeat(seq(',', $.property_value)))),

    property_value: $ => $.property_literal,

    // property_literal: $ =>
    //   choice(
    //     seq($.property_literal, $.COMMONCHAR),
    //     seq($.property_literal, $.STRINGCONSTANT),
    //     $.COMMONCHAR,
    //     $.STRINGCONSTANT
    // ),

    property_literal: $ => repeat1(seq(choice($.COMMONCHAR, $.STRINGCONSTANT, $.XMLCONSTANT, seq('(', $.property_literal, ')')))),
    
    // opt_gates

    gates: $ => seq('gates', ':', repeat($.gate)),
    
    // gates: $ =>
    //   choice(
    //     seq($.gates, $.gate),
    //     $.gate
    // ),

    // gates: $ => repeat1($.gate),

    gate: $ =>
      seq($.gate_typenamesize, optional($.inline_properties), ';', optional($.comment)),

    gate_typenamesize: $ =>
      choice(
        seq($.gatetype, $.NAME),                        // gatetype NAME
        seq($.gatetype, $.NAME, '[', ']'),          // gatetype NAME '[' ']'
        seq($.gatetype, $.NAME, $.vector),              // gatetype NAME vector
        $.NAME,                                         // NAME
        seq($.NAME, '[', ']'),                      // NAME '[' ']'
        seq($.NAME, $.vector)                           // NAME vector
    ),

    gatetype: $ => choice('input', 'output', 'inout'),

    // opt_types
    
    types: $ =>
      seq(
        'types', ':',
        repeat($.localtypes)
    ),
    
    // opt_localtypes

    localtypes: $ =>
      prec.right(repeat1(
        $.localtype
    )),

    localtype: $ =>
      choice(
        $.property_decl,
        $.channel,
        $.channel_interface,
        $.simple_module,
        $.compound_module,
        $.network,
        $.module_interface,
        ';'
    ),
    
    // opt_submodules

    submodules: $ =>
      seq(
        'submodules',
        ':',
        prec.right(repeat(choice($.submodule, $.comment))),
    ),

    // opt_submodules

    // submodules: $ =>
    //   prec.right(repeat1($.submodule)),

    submodule: $ => prec.right(choice(
      seq($.submoduleheader, ';'),
      seq(
        $.submoduleheader,
        '{',
        optional(optional($.parameters)),
        optional(optional($.gates)),
        '}',
        optional(';')
      )
    )),

    submoduleheader: $ => prec.right(choice(
      seq($.submodulename, ':', $.dottedname, optional($.condition)),
      seq($.submodulename, ':', $.likeexpr, 'like', $.dottedname, optional($.condition))
    )),

    submodulename: $ => prec.right(choice($.NAME, seq($.NAME, $.vector))),

    // opt_condition

    likeexpr: $ => choice(
      seq('<', '>'),
      seq('<', $.expression, '>'),
      seq('<', 'default', '(', $.expression, ')', '>'),
    ),

    // opt_connblock

    connections: $ => prec.right(seq(
      'connections',
      optional('allowunconnected'),
      ':',
      repeat(choice($.connection, $.loop_or_condition, $.ifblock, $.forblock, $.comment)),
      // optional(';')
    )),

    // connection: $ => prec(10, seq(
    //   $.connectionname, $.conn_direction, optional(seq(optional($.NAME), optional(seq('{', repeat1(seq(choice($.param, $.property)), '}')), $.conn_direction))), $.connectionname, optional($.condition), ';'
    // )),

    connection: $ => prec.right(choice(
      seq($.connectionname, $.conn_direction, $.connectionname, optional($.loops_and_conditions), ';'),
      seq($.connectionname, $.conn_direction, $.channelspec, $.conn_direction, $.connectionname, optional($.loops_and_conditions), ';'),
    )),

    // link: $ => prec.right(seq($.conn_direction, optional(seq($.identifier, $.conn_direction)))),

    conn_direction: $ => choice('-->', '<--', '<-->'),

    connectionname: $ => prec(10, choice(
      prec(20, seq($.dottednamevector, optional(choice('$i', '$o')), optional('++'))),  // TODO: make this comfirm to yacc?
      seq($.NAME, optional($.subgate)),
      seq($.NAME, optional($.subgate), $.vector),
      seq($.NAME, optional($.subgate), '++')
      // seq($.NAME, optional($.vector), $.subgate, optional($.vector)),
    )),

    dottednamevector: $ => prec.right(seq($.NAME, optional($.vector), repeat(seq('.', $.NAME, optional($.vector))))),

    // opt_loops_and_conditions

    loops_and_conditions: $ => seq(
      $.loop_or_condition,
      repeat(seq(',', $.loop_or_condition))
    ),

    loop_or_condition: $ => choice($.loop, $.condition),

    loop: $ => choice(
      seq(
      'for',
      $.NAME,
      '=',
      $.expression,
      '..',
      $.expression
    )),
    // prec.left(seq('for', /[^{}}]*/, '{', repeat1($.connection), '}'))),

    // connection: $ => choice(
    //   seq($.gatespec, '-->', $.gatespec),
    //   seq($.gatespec, '-->', $.channelspec, '-->', $.gatespec),
    //   seq($.gatespec, '<--', $.gatespec),
    //   seq($.gatespec, '<--', $.channelspec, '<--', $.gatespec),
    //   seq($.gatespec, '<-->', $.gatespec),
    //   seq($.gatespec, '<-->', $.channelspec, '<-->', $.gatespec)
    // ),

    // gatespec: $ => choice(
    //   seq($.mod, '.', $.leftgate),
    //   $.leftgate
    // ),

    // leftmod: $ => choice(
    //   seq($.NAME, $.vector),
    //   $.NAME
    // ),

    // leftgate: $ => choice(
    //   seq($.NAME, optional($.subgate)),
    //   seq($.NAME, optional($.subgate), $.vector),
    //   seq($.NAME, optional($.subgate), '++')
    // ),

    // parentleftgate: $ => choice(
    //   seq($.NAME, optional($.subgate)),
    //   seq($.NAME, optional($.subgate), $.vector),
    //   seq($.NAME, optional($.subgate), '++')
    // ),

    // rightgatespec: $ => choice(
    //   seq($.mod, '.', $.rightgate),
    //   $.rightgate
    // ),

    // mod: $ => prec(10, choice(
    //   $.NAME,
    //   seq($.NAME, $.vector)
    // )),

    // rightgate: $ => choice(
    //   seq($.NAME, optional($.subgate)),
    //   seq($.NAME, optional($.subgate), $.vector),
    //   seq($.NAME, optional($.subgate), '++')
    // ),

    // parentrightgate: $ => choice(
    //   seq($.NAME, optional($.subgate)),
    //   seq($.NAME, optional($.subgate), $.vector),
    //   seq($.NAME, optional($.subgate), '++')
    // ),

    // opt_subgate

    subgate: $ => choice('$i', '$o'),

    // channelspec: $ => choice(
    //   $.channelspec_header,
    //   seq($.channelspec_header, '{', optional($.parameters), '}')
    // ),

    channelspec: $ => choice(
      $.channelspec_header,
      seq($.channelspec_header, '{', optional($.params), '}'),
      seq('{', $.params, '}'),
    ),

    channelspec_header: $ => choice(
      $.channelname,
      $.dottedname,
      seq($.channelname, $.dottedname),
      seq(optional($.channelname), $.likeexpr, 'like', $.dottedname)
    ),
    

    channelname: $ => seq($.NAME, ':'),

    // opt_channelname

    condition: $ => seq('if', $.expression),

    ifblock: $ => alias(seq('if', $.expression, '{', repeat(choice($.connection, $.comment)), '}'), $.connection_group),

    forblock: $ => seq(seq($.loop, repeat(seq(',', $.loop))), '{', repeat(choice($.connection, $.comment)), '}', optional(';')),

    vector: $ => seq('[', $.expression, ']'),

    expression: $ => prec.right(10, choice(
      $.simple_expr,
      $.functioncall,
      seq($.expression, '.', $.functioncall),
      $.object,
      $.array,
      seq('(', $.expression, ')'),
    
      seq($.expression, '+', $.expression),
      seq($.expression, '-', $.expression),
      seq($.expression, '*', $.expression),
      seq($.expression, '/', $.expression),
      seq($.expression, '%', $.expression),
      seq($.expression, '^', $.expression),
      seq('-', $.expression),
    
      seq($.expression, '==', $.expression),
      seq($.expression, '!=', $.expression),
      seq($.expression, '>', $.expression),
      seq($.expression, '>=', $.expression),
      seq($.expression, '<', $.expression),
      seq($.expression, '<=', $.expression),
      seq($.expression, '<=>', $.expression),
      seq($.expression, 'match', $.expression),
    
      seq($.expression, '&&', $.expression),
      seq($.expression, '||', $.expression),
      seq($.expression, '^^', $.expression),
    
      seq('!', $.expression),
    
      seq($.expression, '&', $.expression),
      seq($.expression, '|', $.expression),
      seq($.expression, '#', $.expression),
    
      seq('~', $.expression),
      seq($.expression, '<<', $.expression),
      seq($.expression, '>>', $.expression),
    
      seq($.expression, '?', $.expression, ':', $.expression)
    )),

    functioncall: $ => seq($.funcname, '(', optional($.exprlist), ')'),

    array: $ => choice(
      seq('[', ']'),
      seq('[', $.exprlist, ']'),
      seq('[', $.exprlist, ',', ']'),
    ),

    // exprlist: $ => prec.right(choice(
    //   seq($.exprlist, ',', $.expression),
    //   $.expression
    // )),

    object: $ => choice(
      seq('{', optional($.keyvaluelist), '}'),
      seq($.NAME, '{', optional($.keyvaluelist), '}'),
      seq($.NAME, '::', $.NAME, '{', optional($.keyvaluelist), '}'),
      seq($.NAME, '::', $.NAME, '::', $.NAME, '{', optional($.keyvaluelist), '}'),
      seq($.NAME, '::', $.NAME, '::', $.NAME, '::', $.NAME, '{', optional($.keyvaluelist), '}')
    ),

    exprlist: $ => prec.right(seq($.expression, repeat(seq(',', $.expression)))),

    keyvaluelist: $ => seq($.keyvalue, repeat1(seq(',', $.keyvalue))),

    keyvalue: $ => seq($.key, ':', $.expression),

    key: $ => choice(
      $.STRINGCONSTANT,
      $.NAME,
      $.INTCONSTANT,
      $.REALCONSTANT,
      $.quantity,
      seq('-', $.INTCONSTANT),
      seq('-', $.REALCONSTANT),
      seq('-', $.quantity),
      'nan',
      'inf',
      seq('-', 'inf'),
      'true',
      'false',
      'null',
      'nullptr'
    ),

    simple_expr: $ => choice($.qname, $.operator, $.literal),

    funcname: $ => choice(
      $.qname,
      'bool',
      'int',
      'double',
      'string',
      'object',
      'xml',
      'xmldoc'
    ),

    qname_elem: $ => prec.right(10, choice(
      $.NAME,
      seq($.NAME, '[', $.expression, ']'),
      'this',
      'parent'
    )),

    qname: $ => prec.right(seq($.qname_elem, repeat(seq('.', $.qname_elem)))),
    
    operator: $ => prec(20, choice(
      // 'index',
      // 'typename',
      seq($.qname, '.', 'index'),
      seq($.qname, '.', 'typename'),
      seq('exists', '(', $.qname, ')'),
      seq('sizeof', '(', $.qname, ')')
    )),

    literal: $ => choice(
      $.STRINGCONSTANT,
      $.XMLCONSTANT,
      $.boolliteral,
      $.numliteral,
      $.otherliteral,
    ),

    boolliteral: $ => choice('true', 'false'),

    numliteral: $ => choice($.INTCONSTANT, $.realconstant_ext, $.quantity),

    otherliteral: $ => choice('undefined', 'nullptr', 'null'),

    // literal: $ => choice(
    //   $.string_literal,
    //   $.bool_literal,
    //   $.num_literal,
    //   $.other_literal
    // ),

    quantity: $ => prec(10, choice(
      seq($.quantity, $.INTCONSTANT, $.NAME),
      seq($.quantity, $.realconstant_ext, $.NAME),
      seq($.quantity, $.intconstant_ext, $.NAME),
      seq($.INTCONSTANT, $.NAME),
      seq($.realconstant_ext, $.NAME),
      seq($.intconstant_ext, $.NAME)
    )),

    // intconstant_ext: $ => seq(optional($.INTCONSTANT), 'e', $.INTCONSTANT),

    intconstant_ext: $ => /[0-9]+e[0-9]*/,

    realconstant_ext: $ => choice($.REALCONSTANT, 'inf', 'nan', $.intconstant_ext, seq('.', $.INTCONSTANT)),   // last one is a kludge for parsing default(.1s);

    // opt_semicolon

    NAME: $ => /[_a-zA-Z][_a-zA-Z0-9]*/,
    // PROPNAME: $ => /[_a-zA-Z][_a-zA-Z0-9]*/,
    INTCONSTANT: $ => /\d+/,
    REALCONSTANT: $ => /\d+\.\d+/,
    STRINGCONSTANT: $ => /"([^"\\]|\\.)*"/,
    XMLCONSTANT: $ => /"[^"]*"/,                        // TODO: what if xml('<foo="bar">')
    // CHARCONSTANT: $ => /'([^'\\]|\\.)'/,
    // DOUBLEASTERISK: $ => '**',
    // PLUSPLUS: $ => '++',
    // EQ: $ => '==',
    // NE: $ => '!=',
    // GE: $ => '>=',
    // LE: $ => '<=',
    // SPACESHIP: $ => '<=>',
    // AND: $ => '&&',
    // OR: $ => '||',
    // XOR: $ => '^^',
    // SHIFT_LEFT: $ => '<<',
    // SHIFT_RIGHT: $ => '>>',
    // DOUBLECOLON: $ => '::',
    // EXPRESSION_SELECTOR: $ => /[_a-zA-Z][_a-zA-Z0-9]*/,
    COMMONCHAR: $ => /[^"]/,
    // INVALID_CHAR: $ => /./  
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
    
    
    

    


    
  }
});
