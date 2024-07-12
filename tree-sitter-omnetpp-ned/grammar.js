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
        $._EMPTYLINE,
        $.package,
        $.import,
        $.property_decl,
        alias(seq(
          $._property_namevalue,
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
    
    // definition: $ => choice(
    //   $.comment,
    //   $._EMPTYLINE,
    //   $.package,
    //   $.import,
    //   $.property_decl,
    //   alias(seq(
    //     $._property_namevalue,
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

    comment: $ => prec.right(repeat1($._commentline)),

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
      alias($.dottedname, $.name),
      ';'
    ),

    dottedname: $ => prec.right(seq($._NAME, repeat(seq('.', $._NAME)))),

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
  
    // _importname: $ => choice($._NAME, 'message', 'packet', 'class', 'struct', 'enum', 'abstract'),

    // importname: $ => choice(
    //   seq($.importname, $._NAME),
    //   seq($.importname, '*'),
    //   seq($.importname, '**'),
    //   $._NAME,
    //   '*',
    //   '**'
    // ),

    importname: $ => repeat1(choice($._NAME, '*', '**')),

    property: $ => seq(
      $._property_namevalue,
      // ';'
    ),
    
    property_decl: $ => choice(
      seq($.property_decl_header, optional($.inline_properties), ';'),
      seq($.property_decl_header, '(', optional($.property_decl_keys), ')', optional($.inline_properties), ';')
    ),

    property_decl_header: $ => choice(
      seq('property', '@', $._NAME, '[', ']'),
      seq('property', '@', $._NAME)
    ),
    
    // property_decl_keys: $ => seq(
    //   choice($.property_decl_keys, $.property_decl_key),
    //   ';',
    //   $.property_decl_key
    // ),

    property_decl_keys: $ => seq($.property_decl_key, repeat(seq(';', $.property_decl_key))),

    property_decl_key: $ => $._property_literal,

    fileproperty: $ => seq(
      $._property_namevalue,
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
      $._NAME,
      optional($.inheritance)
    ),

    inheritance: $ => choice(      
      'extends',
      seq('like', $.likenames),
      seq('extends', $.extends),
      seq('extends', $.extends, 'like', $.likenames)
    ),
    
    extends: $ => alias($.dottedname, $.name),

    // likenames: $ => prec.left(choice(
    //   seq(
    //     $.likenames,
    //     ',',
    //     $.likename
    // ),
    // $.likename)),

    likenames: $ => seq($.likename, repeat(seq(',', $.likename))),

    likename: $ => alias($.dottedname, $.interface_name),

    channel_interface: $ => seq(
      $.channelinterfaceheader,
      '{',
      optional($.parameters),
      '}'
    ),

    channelinterfaceheader: $ => seq(
      'channelinterface',
      $._NAME,
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
      $._NAME,
      optional($.inheritance)
    ),

    compound_module: $ => seq(
      alias($.compoundmoduleheader, $.header),
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
      alias($._NAME, $.name),
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
      $._NAME,
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
      $._NAME,
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
      $._params,
      seq('parameters:', $._params),
      'parameters:'
    ),

    // parameters: $ => seq(optional('parameters:'), $.params),

    // params: $ => choice(
    //   seq($.params, $._paramsitem),
    //   $._paramsitem
    // ),

    _params: $ => repeat1($._paramsitem),

    _paramsitem: $ => prec.right(10, seq(choice($.param, $.property), ';', optional($.comment))),
    
    param: $ => choice(
      $._param_typenamevalue,
      $.parampattern_value
    ),
    
    _param_typenamevalue: $ => choice(
      seq(
        $._param_typename,
        optional($.inline_properties)
      ),
      seq(
        $._param_typename,
        optional($.inline_properties),
        '=',
        alias($.paramvalue, $.value),
        optional($.inline_properties)
      )
    ),

    _param_typename: $ => choice(
      seq(
        optional('volatile'),
        alias($.paramtype, $.type),
        alias($._NAME, $.name)
      ),
      alias($._NAME, $.name)
    ),
    
    parampattern_value: $ => seq(
      $.parampattern,
      optional($.inline_properties),
      '=',
      alias($.paramvalue, $.value)
    ),
    
    paramtype: $ => choice(
      'double',
      'int',
      'string',
      'bool',
      'object',
      'xml'
    ),
    
    paramvalue: $ => prec.right(choice(
      $.expression,
      seq('default', '(', $.expression, ')'),
      'default',
      'ask',
    )),
    
    // inline_properties: $ => choice(
    //   $._property_namevalue,
    //   seq($.inline_properties, $._property_namevalue)
    // ),

    inline_properties: $ => repeat1($._property_namevalue),

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
    //   seq($._NAME, '$', $._NAME),
    //   $._NAME,
    //   'channel',
    //   seq('{', $.pattern_index, '}'),
    //   '*',
    //   seq($.pattern_name, $._NAME),
    //   seq($.pattern_name, '{', $.pattern_index, '}'),
    //   seq($.pattern_name, '*')
    // )),

    pattern_name: $ => prec.right(10, repeat1(choice(
      $._NAME,
      seq($._NAME, '$', $._NAME),
      'channel',
      seq('{', $.pattern_index, '}'),
      '*',
    ))),
    
    pattern_index: $ => choice(
      $._INTCONSTANT,
      seq($._INTCONSTANT, '..', $._INTCONSTANT),
      seq('..', $._INTCONSTANT),
      seq($._INTCONSTANT, '..')
    ),

    _property_namevalue: $ =>
      choice(
        alias($.property_name, $.name),
        prec.right(seq(alias($.property_name, $.name), '(', optional($._property_keys), ')'))
    ),
    
    property_name: $ =>
      prec.right(choice(
        seq('@', $._PROPNAME),
        // seq('@', $._PROPNAME, '[', $.dottedname, ']'),
        // seq('@', $._PROPNAME, '[', $._INTCONSTANT, ']'),
        seq('@', $._PROPNAME, '[', $._PROPINDEX, ']'),
    )),

    // optional($._property_keys)

    // property_keys: $ =>
    //   choice(
    //     seq($._property_keys, ';', $.property_key),
    //     $.property_key
    // ),

    _property_keys: $ => seq(alias($.property_key, $.key), repeat(seq(';', alias($.property_key, $.key))), optional(';')),

    property_key: $ =>
      prec.right(choice(
        seq(
          alias($._property_literal, $.name),
          '=',
          alias(optional($._property_value), $.values)
        ),
          alias($.property_values, $.values),
      )),

    // property_values: $ =>
    //   prec.right(10, choice(
    //     seq($.property_values, optional(seq(',', $.property_value))),
    //     $.property_value
    // )),

    property_values: $ => prec.right(seq($._property_value, repeat(seq(',', $._property_value)))),

    _property_value: $ => $._property_literal,

    // property_literal: $ =>
    //   choice(
    //     seq($._property_literal, $._COMMONCHAR),
    //     seq($._property_literal, $._STRINGCONSTANT),
    //     $._COMMONCHAR,
    //     $._STRINGCONSTANT
    // ),

    _property_literal: $ => repeat1(seq(choice($._COMMONCHAR, $._STRINGCONSTANT, $._XMLCONSTANT, seq('(', $._property_literal, ')')))),

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
        seq($.gatetype, alias($._NAME, $.name)),                        // gatetype NAME
        seq($.gatetype, alias($._NAME, $.name), '[', ']'),          // gatetype NAME '[' ']'
        seq($.gatetype, alias($._NAME, $.name), alias($.vector, $.size)),              // gatetype NAME vector
        alias($._NAME, $.name),                                         // NAME
        seq(alias($._NAME, $.name), '[', ']'),                      // NAME '[' ']'
        seq(alias($._NAME, $.name), alias($.vector, $.size))                           // NAME vector
    ),

    gatetype: $ => alias(choice('input', 'output', 'inout'), $.type),
    
    types: $ =>
      seq(
        'types', ':',
        repeat($.localtypes)
    ),

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
        $.network,              // TODO is this needed here? not in DTD
        $.module_interface,
        ';'
    ),
  

    submodules: $ =>
      seq(
        'submodules',
        ':',
        prec.right(repeat(choice($.submodule, $.comment))),
    ),

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
      seq($.submodulename, ':', $.likeexpr, 'like', alias($.dottedname, $.interface_name), optional($.condition))
    )),

    submodulename: $ => prec.right(choice($._NAME, seq($._NAME, $.vector))),

    likeexpr: $ => choice(
      seq('<', '>'),
      seq('<', $.expression, '>'),
      seq('<', 'default', '(', $.expression, ')', '>'),
    ),

    connections: $ => prec.right(seq(
      'connections',
      alias(optional('allowunconnected'), $.allowunconnected),
      ':',
      repeat(choice($.connection, $.loop_or_condition, alias($.ifblock, $.connection_group), alias($.forblock, $.connection_group), $.comment)),
      // optional(';')
    )),

    // connection: $ => prec(10, seq(
    //   $.connectionname, $.conn_direction, optional(seq(optional($._NAME), optional(seq('{', repeat1(seq(choice($.param, $.property)), '}')), $.conn_direction))), $.connectionname, optional($.condition), ';'
    // )),

    connection: $ => prec.right(choice(
      seq($.connectionname, $.conn_direction, $.connectionname, optional($.loops_and_conditions), ';'),
      seq($.connectionname, $.conn_direction, $.channelspec, $.conn_direction, $.connectionname, optional($.loops_and_conditions), ';'),
    )),

    // link: $ => prec.right(seq($.conn_direction, optional(seq($.identifier, $.conn_direction)))),

    conn_direction: $ => choice('-->', '<--', '<-->'),

    connectionname: $ => prec(10, choice(
      // seq($.dottednamevector, optional($.subgate)),
      prec(20, seq($.dottednamevector, optional($.subgate), alias(optional('++'), $.plusplus))),  // TODO: make this comfirm to yacc?
      seq($.dottednamevector, optional($.subgate), $.vector),
      // seq($.dottednamevector, optional($.subgate), alias(optional('++'), $.plusplus))
      // seq($._NAME, optional($.vector), $.subgate, optional($.vector)),
    )),

    dottednamevector: $ => prec.right(seq($._NAME, optional($.vector), repeat(seq('.', $._NAME, optional($.vector))))),

    loops_and_conditions: $ => seq(
      $.loop_or_condition,
      repeat(seq(',', $.loop_or_condition))
    ),

    loop_or_condition: $ => choice($.loop, $.condition),

    loop: $ => choice(
      seq(
      'for',
      alias($._NAME, $.param_name),
      '=',
      alias($.expression, $.from_value),
      '..',
      alias($.expression, $.to_value)
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
    //   seq($._NAME, $.vector),
    //   $._NAME
    // ),

    // leftgate: $ => choice(
    //   seq($._NAME, optional($.subgate)),
    //   seq($._NAME, optional($.subgate), $.vector),
    //   seq($._NAME, optional($.subgate), '++')
    // ),

    // parentleftgate: $ => choice(
    //   seq($._NAME, optional($.subgate)),
    //   seq($._NAME, optional($.subgate), $.vector),
    //   seq($._NAME, optional($.subgate), '++')
    // ),

    // rightgatespec: $ => choice(
    //   seq($.mod, '.', $.rightgate),
    //   $.rightgate
    // ),

    // mod: $ => prec(10, choice(
    //   $._NAME,
    //   seq($._NAME, $.vector)
    // )),

    // rightgate: $ => choice(
    //   seq($._NAME, optional($.subgate)),
    //   seq($._NAME, optional($.subgate), $.vector),
    //   seq($._NAME, optional($.subgate), '++')
    // ),

    // parentrightgate: $ => choice(
    //   seq($._NAME, optional($.subgate)),
    //   seq($._NAME, optional($.subgate), $.vector),
    //   seq($._NAME, optional($.subgate), '++')
    // ),

    subgate: $ => choice('$i', '$o'),

    // channelspec: $ => choice(
    //   $.channelspec_header,
    //   seq($.channelspec_header, '{', optional($.parameters), '}')
    // ),

    channelspec: $ => choice(
      $.channelspec_header,
      seq($.channelspec_header, '{', optional($._params), '}'),
      seq('{', $._params, '}'),
    ),

    channelspec_header: $ => choice(
      $.channelname,
      $.dottedname,
      seq($.channelname, $.dottedname),
      seq(optional($.channelname), $.likeexpr, 'like', alias($.dottedname, $.interface_name))
    ),
    

    channelname: $ => seq($._NAME, ':'),

    condition: $ => seq('if', $.expression),

    ifblock: $ => seq('if', $.expression, '{', repeat(choice($.connection, $.comment)), '}'),

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
      seq($._NAME, '{', optional($.keyvaluelist), '}'),
      seq($._NAME, '::', $._NAME, '{', optional($.keyvaluelist), '}'),
      seq($._NAME, '::', $._NAME, '::', $._NAME, '{', optional($.keyvaluelist), '}'),
      seq($._NAME, '::', $._NAME, '::', $._NAME, '::', $._NAME, '{', optional($.keyvaluelist), '}')
    ),

    exprlist: $ => prec.right(seq($.expression, repeat(seq(',', $.expression)))),

    keyvaluelist: $ => seq($.keyvalue, repeat1(seq(',', $.keyvalue))),

    keyvalue: $ => seq($.key, ':', $.expression),

    key: $ => choice(
      $._STRINGCONSTANT,
      $._NAME,
      $._INTCONSTANT,
      $._REALCONSTANT,
      $.quantity,
      seq('-', $._INTCONSTANT),
      seq('-', $._REALCONSTANT),
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
      $._NAME,
      seq($._NAME, '[', $.expression, ']'),
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
      $._STRINGCONSTANT,
      $._XMLCONSTANT,
      $.boolliteral,
      $.numliteral,
      $.otherliteral,
    ),

    boolliteral: $ => choice('true', 'false'),

    numliteral: $ => choice($._INTCONSTANT, $.realconstant_ext, $.quantity),

    otherliteral: $ => choice('undefined', 'nullptr', 'null'),

    // literal: $ => choice(
    //   $.string_literal,
    //   $.bool_literal,
    //   $.num_literal,
    //   $.other_literal
    // ),

    quantity: $ => prec(10, choice(
      seq($.quantity, $._INTCONSTANT, $._NAME),
      seq($.quantity, $.realconstant_ext, $._NAME),
      seq($.quantity, $.intconstant_ext, $._NAME),
      seq($._INTCONSTANT, $._NAME),
      seq($.realconstant_ext, $._NAME),
      seq($.intconstant_ext, $._NAME)
    )),

    // intconstant_ext: $ => seq(optional($._INTCONSTANT), 'e', $._INTCONSTANT),

    intconstant_ext: $ => /[0-9]+e[0-9]*/,

    realconstant_ext: $ => choice($._REALCONSTANT, 'inf', 'nan', $.intconstant_ext, seq('.', $._INTCONSTANT)),   // last one is a kludge for parsing default(.1s);

    _NAME: $ => /[_a-zA-Z][_a-zA-Z0-9]*/,
    _PROPNAME: $ => /[a-zA-Z_][a-zA-Z0-9_:.-]*/,
    _PROPINDEX: $ => /[a-zA-Z_][a-zA-Z0-9_*?{}:.-]*/,
    _INTCONSTANT: $ => /\d+/,
    _REALCONSTANT: $ => /\d+\.\d+/,
    _STRINGCONSTANT: $ => /"([^"\\]|\\.)*"/,
    _XMLCONSTANT: $ => /"[^"]*"|'[^']*'/,
    _EMPTYLINE: $ => /\r?\n\s*\r?\n\s*/,
    // CHARCONSTANT: $ => /'([^'\\]|\\.)'/,
    _COMMONCHAR: $ => /[^"]/,
    // INVALID_CHAR: $ => /./  
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
    
    
    

    


    
  }
});
