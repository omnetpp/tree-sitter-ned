module.exports = grammar({
  name: "ned",

  extras: ($) => [/\s/, $.inline_comment],

  // conflicts: ($) => [[$._dottedname, $._dottednamevector]],

  conflicts: ($) => [[$._dottedname, $._modulepart]],

  rules: {
    nedfile: ($) =>
      prec.right(
        repeat1(
          choice(
            $.comment,
            $._EMPTYLINE,
            $.package,
            $.import,
            $.property_decl,
            alias(seq($._property_namevalue, ";"), $.property),
            $.channel,
            $.channel_interface,
            $.simple,
            $.module,
            $.network,
            $.module_interface,
            ";",
          ),
        ),
      ),

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
    //   $.simple,
    //   $.module,
    //   $.network,
    //   $.module_interface,
    //   ';'
    // ),

    comment: ($) => prec.right(repeat1($._commentline)),

    _commentline: ($) =>
      token(
        seq("//", /(\\+(.|\r?\n)|[^\\\n])*/),
        // seq(
        //   '/*',
        //   /[^*]*\*+([^/*][^*]*\*+)*/,
        //   '/',
        // ),    // TODO is that needed in msg files? NO
      ),

    inline_comment: ($) => $._commentline,

    package: ($) => seq("package", alias($._dottedname, $.name), ";"),

    _dottedname: ($) => prec.right(seq($._NAME, repeat(seq(".", $._NAME)))),

    // import: $ => seq(
    //   'import',
    //   $.importspec,
    //   ';'
    // ),

    // importspec: $ => choice(
    //   seq($.importspec, '.', $._importname),
    //   $._importname
    // ),

    // importspec: $ => prec.right(seq($._importname, repeat(seq(',', $._importname)))),

    import: ($) => seq("import", alias($.importspec, $.name), ";"),

    importspec: ($) =>
      choice(
        $._import_un_qname,
        seq(repeat(seq($._importname, ".")), $._import_un_qname),
      ),

    _import_un_qname: ($) => $._importname,

    // _importname: $ => choice($._NAME, 'message', 'packet', 'class', 'struct', 'enum', 'abstract'),

    // importname: $ => choice(
    //   seq($._importname, $._NAME),
    //   seq($._importname, '*'),
    //   seq($._importname, '**'),
    //   $._NAME,
    //   '*',
    //   '**'
    // ),

    _importname: ($) => repeat1(choice($._NAME, "*", "**")),

    property: ($) =>
      seq(
        $._property_namevalue,
        // ';'
      ),

    property_decl: ($) =>
      choice(
        seq($.property_decl_header, optional($.inline_properties), ";"),
        seq(
          $.property_decl_header,
          "(",
          optional($.property_decl_keys),
          ")",
          optional($.inline_properties),
          ";",
        ),
      ),

    property_decl_header: ($) =>
      choice(
        seq("property", "@", $._NAME, "[", "]"),
        seq("property", "@", $._NAME),
      ),

    // property_decl_keys: $ => seq(
    //   choice($.property_decl_keys, $.property_decl_key),
    //   ';',
    //   $.property_decl_key
    // ),

    property_decl_keys: ($) =>
      seq($.property_decl_key, repeat(seq(";", $.property_decl_key))),

    property_decl_key: ($) => $._property_literal,

    fileproperty: ($) => seq($._property_namevalue, ";"),

    channel: ($) => seq($.channelheader, "{", optional($.parameters), "}"),

    channelheader: ($) => seq("channel", $._NAME, optional($._inheritance)),

    _inheritance: ($) =>
      choice(
        "extends",
        seq("like", $._likenames),
        seq("extends", $.extends),
        seq("extends", $.extends, "like", $._likenames),
      ),

    extends: ($) => $._dottedname,

    // likenames: $ => prec.left(choice(
    //   seq(
    //     $._likenames,
    //     ',',
    //     $._likename
    // ),
    // $._likename)),

    _likenames: ($) => seq($._likename, repeat(seq(",", $._likename))),

    _likename: ($) => alias($._dottedname, $.implements),

    channel_interface: ($) =>
      seq($.channelinterfaceheader, "{", optional($.parameters), "}"),

    channelinterfaceheader: ($) =>
      seq("channelinterface", $._NAME, optional($.interfaceinheritance)),

    interfaceinheritance: ($) => seq("extends", $.extendss),

    // extendss: $ => prec.left(choice(
    //   seq(
    //     $.extendss,
    //     ',',
    //     $.extends
    // ),
    // $.extends)),

    extendss: ($) => seq($.extends, repeat(seq(",", $.extends))),

    simple: ($) =>
      seq(
        $._simplemoduleheader,
        "{",
        optional($.parameters),
        optional($.gates),
        "}",
      ),

    _simplemoduleheader: ($) =>
      seq("simple", alias($._NAME, $.name), optional($._inheritance)),

    module: ($) =>
      seq(
        $._compoundmoduleheader,
        "{",
        optional($.parameters),
        optional($.gates),
        optional($.types),
        optional($.submodules),
        optional($.connections),
        "}",
      ),

    _compoundmoduleheader: ($) =>
      seq("module", alias($._NAME, $.name), optional($._inheritance)),

    network: ($) =>
      seq(
        $._networkheader,
        "{",
        optional($.parameters),
        optional($.gates),
        optional($.types),
        optional($.submodules),
        optional($.connections),
        "}",
      ),

    _networkheader: ($) =>
      seq("network", alias($._NAME, $.name), optional($._inheritance)),

    module_interface: ($) =>
      seq(
        $.moduleinterfaceheader,
        "{",
        optional($.parameters),
        optional($.gates),
        "}",
      ),

    moduleinterfaceheader: ($) =>
      seq("moduleinterface", $._NAME, optional($.interfaceinheritance)),

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

    parameters: ($) =>
      choice($._params, seq("parameters:", $._params), "parameters:"),

    // parameters: $ => seq(optional('parameters:'), $.params),

    // params: $ => choice(
    //   seq($.params, $._paramsitem),
    //   $._paramsitem
    // ),

    _params: ($) => repeat1($._paramsitem),

    _paramsitem: ($) =>
      prec.right(
        10,
        seq(choice($.parameter, $.property), ";", optional($.comment)),
      ),

    parameter: ($) => choice($._param_typenamevalue, $._parampattern_value),

    _param_typenamevalue: ($) =>
      choice(
        seq($._param_typename, optional($.inline_properties)),
        seq(
          $._param_typename,
          optional($.inline_properties),
          "=",
          alias($.paramvalue, $.value),
          optional($.inline_properties),
        ),
      ),

    _param_typename: ($) =>
      choice(
        seq(
          optional("volatile"),
          alias($.paramtype, $.type),
          alias($._NAME, $.name),
        ),
        alias($._NAME, $.name),
      ),

    _parampattern_value: ($) =>
      seq(
        $._parampattern,
        optional($.inline_properties),
        "=",
        alias($.paramvalue, $.value),
      ),

    paramtype: ($) =>
      choice("double", "int", "string", "bool", "object", "xml"),

    paramvalue: ($) =>
      prec.right(
        choice(
          $._expression,
          seq("default", "(", $._expression, ")"),
          "default",
          "ask",
        ),
      ),

    // inline_properties: $ => choice(
    //   $._property_namevalue,
    //   seq($.inline_properties, $._property_namevalue)
    // ),

    inline_properties: ($) => repeat1($._property_namevalue),

    _parampattern: ($) => $.pattern,

    // pattern: $ =>
    //   choice(
    //     seq($.pattern2, '.', $._pattern_elem),
    //     seq($.pattern2, '.', 'typename')
    // ),

    // // pattern2: $ => choice(
    // //   seq($.pattern2, '.', $._pattern_elem),
    // //   $._pattern_elem
    // // ),

    // pattern2: $ => prec.right(seq($._pattern_elem, repeat(seq('.', $._pattern_elem)))),

    pattern: ($) =>
      seq(
        prec.right(seq($._pattern_elem, repeat(seq(".", $._pattern_elem)))),
        ".",
        choice($._pattern_elem, "typename"),
      ),

    _pattern_elem: ($) =>
      choice(
        seq($._pattern_name, "[", $.pattern_index, "]"),
        seq($._pattern_name, "[", "*", "]"),
        "**",
        $._pattern_name,
      ),

    // pattern_name: $ => prec.left(choice(
    //   seq($._NAME, '$', $._NAME),
    //   $._NAME,
    //   'channel',
    //   seq('{', $.pattern_index, '}'),
    //   '*',
    //   seq($._pattern_name, $._NAME),
    //   seq($._pattern_name, '{', $.pattern_index, '}'),
    //   seq($._pattern_name, '*')
    // )),

    _pattern_name: ($) =>
      prec.right(
        10,
        repeat1(
          choice(
            $._NAME,
            seq($._NAME, "$", $._NAME),
            "channel",
            seq("{", $.pattern_index, "}"),
            "*",
          ),
        ),
      ),

    pattern_index: ($) =>
      choice(
        $._INTCONSTANT,
        seq($._INTCONSTANT, "..", $._INTCONSTANT),
        seq("..", $._INTCONSTANT),
        seq($._INTCONSTANT, ".."),
      ),

    _property_namevalue: ($) =>
      choice(
        $._property_name,
        prec.right(seq($._property_name, "(", optional($._property_tags), ")")),
      ),

    _property_name: ($) =>
      prec.right(
        choice(
          seq("@", alias($._PROPNAME, $.name)),
          // seq('@', $._PROPNAME, '[', $._dottedname, ']'),
          // seq('@', $._PROPNAME, '[', $._INTCONSTANT, ']'),
          seq(
            "@",
            alias($._PROPNAME, $.name),
            "[",
            alias($._PROPINDEX, $.index),
            "]",
          ),
        ),
      ),

    // optional($._property_tags)

    // property_keys: $ =>
    //   choice(
    //     seq($._property_tags, ';', $.property_key),
    //     $.property_key
    // ),

    _property_tags: ($) =>
      seq(
        alias($.property_tag, $.tag),
        repeat(seq(";", alias($.property_tag, $.tag))),
        optional(";"),
      ),

    property_tag: ($) =>
      prec.right(
        choice(
          seq(
            alias($._property_literal, $.name),
            "=",
            alias(optional($._property_value), $.value_list),
          ),
          alias($.property_values, $.value_list),
        ),
      ),

    // property_values: $ =>
    //   prec.right(10, choice(
    //     seq($.property_values, optional(seq(',', $.property_value))),
    //     $.property_value
    // )),

    property_values: ($) =>
      prec.right(seq($._property_value, repeat(seq(",", $._property_value)))),

    _property_value: ($) => $._property_literal,

    // property_literal: $ =>
    //   choice(
    //     seq($._property_literal, $._COMMONCHAR),
    //     seq($._property_literal, $._STRINGCONSTANT),
    //     $._COMMONCHAR,
    //     $._STRINGCONSTANT
    // ),

    _property_literal: ($) =>
      repeat1(
        seq(
          choice(
            $._COMMONCHAR,
            $._STRINGCONSTANT,
            $._XMLCONSTANT,
            seq("(", $._property_literal, ")"),
          ),
        ),
      ),

    gates: ($) => seq("gates", ":", repeat($.gate)),

    // gates: $ =>
    //   choice(
    //     seq($.gates, $.gate),
    //     $.gate
    // ),

    // gates: $ => repeat1($.gate),

    gate: ($) =>
      seq(
        $._gate_typenamesize,
        optional($.inline_properties),
        ";",
        optional($.comment),
      ),

    _gate_typenamesize: ($) =>
      choice(
        seq($._gatetype, alias($._NAME, $.name)), // gatetype NAME
        seq($._gatetype, alias($._NAME, $.name), alias("[]", $.vector)), // gatetype NAME '[' ']'
        seq($._gatetype, alias($._NAME, $.name), alias($.sizevector, $.vector)), // gatetype NAME vector
        alias($._NAME, $.name), // NAME
        seq(alias($._NAME, $.name), "[", "]"), // NAME '[' ']'
        seq(alias($._NAME, $.name), alias($.sizevector, $.vector)), // NAME vector
      ),

    _gatetype: ($) => alias(choice("input", "output", "inout"), $.type),

    types: ($) => seq("types", ":", repeat($._localtypes)),

    _localtypes: ($) => prec.right(repeat1($._localtype)),

    _localtype: ($) =>
      choice(
        $.property_decl,
        $.channel,
        $.channel_interface,
        $.simple,
        $.module,
        $.network, // TODO is this needed here? not in DTD
        $.module_interface,
        ";",
      ),

    submodules: ($) =>
      seq(
        "submodules",
        ":",
        prec.right(repeat(choice($.submodule, $.comment))),
      ),

    // submodules: $ =>
    //   prec.right(repeat1($.submodule)),

    submodule: ($) =>
      prec.right(
        choice(
          seq($._submoduleheader, ";"),
          seq(
            $._submoduleheader,
            "{",
            optional(optional($.parameters)),
            optional(optional($.gates)),
            "}",
            optional(";"),
          ),
        ),
      ),

    _submoduleheader: ($) =>
      prec.right(
        choice(
          seq(
            $._submodulename,
            ":",
            alias($._dottedname, $.type),
            optional($.condition),
          ),
          seq(
            $._submodulename,
            ":",
            alias($.likeexpr, $.like_expr),
            "like",
            alias($._dottedname, $.like_type),
            optional($.condition),
          ),
        ),
      ),

    _submodulename: ($) =>
      prec.right(
        choice(
          alias($._NAME, $.name),
          seq(alias($._NAME, $.name), alias($.sizevector, $.vector)),
        ),
      ),

    likeexpr: ($) =>
      choice(
        seq("<", ">"),
        seq("<", $._expression, ">"),
        seq("<", "default", "(", $._expression, ")", ">"),
      ),

    connections: ($) =>
      prec.right(
        seq(
          "connections",
          alias(optional("allowunconnected"), $.allowunconnected),
          ":",
          repeat(
            choice(
              $.connection,
              $._loop_or_condition,
              alias($.ifblock, $.connection_group),
              alias($.forblock, $.connection_group),
              $.comment,
            ),
          ),
          // optional(';')
        ),
      ),

    // connection: $ => prec(10, seq(
    //   $.connectionname, $.arrow, optional(seq(optional($._NAME), optional(seq('{', repeat1(seq(choice($.param, $.property)), '}')), $.arrow))), $.connectionname, optional($.condition), ';'
    // )),

    connection: ($) =>
      prec.right(
        choice(
          seq(
            alias($.connectionname, $.src),
            $.arrow,
            alias($.connectionname, $.dest),
            optional($._loops_and_conditions),
            ";",
          ),
          seq(
            alias($.connectionname, $.src),
            $.arrow,
            $._channelspec,
            $.arrow,
            alias($.connectionname, $.dest),
            optional($._loops_and_conditions),
            ";",
          ),
        ),
      ),

    // link: $ => prec.right(seq($.arrow, optional(seq($.identifier, $.arrow)))),

    arrow: ($) => choice("-->", "<--", "<-->"),

    // connectionname: ($) =>
    //   prec(
    //     10,
    //     choice(
    //       // seq($._dottednamevector, optional($.subgate)),
    //       prec(
    //         20,
    //         seq(
    //           $._dottednamevector,
    //           optional($.subgate),
    //           alias(optional("++"), $.plusplus),
    //         ),
    //       ), // TODO: make this comfirm to yacc?
    //       seq($._dottednamevector, optional($.subgate), $.vector),
    //       // seq($._dottednamevector, optional($.subgate), alias(optional('++'), $.plusplus))
    //       // seq($._NAME, optional($.vector), $.subgate, optional($.vector)),
    //     ),
    //   ),

    // _dottednamevector: ($) =>
    //   prec.right(choice(
    //     alias(seq(
    //       alias($._NAME, $.gatename),
    //       alias(optional($.vector), $.gateindex),
    //     ), $.gate2),
    //     seq(
    //       alias(repeat1(seq(alias($._NAME, $.name), optional(alias($.vector, $.index)))), $.module),
    //       ".",
    //       alias(seq(alias($._NAME, $.gatename),
    //       alias(optional($.vector), $.gateindex)), $.gate2),
    //     ),
    //   )),

    connectionname: ($) => $._modulegate,

    _modulegate: ($) =>
      prec.left(seq(optional($._modulepart), alias($.gatepart, $.gate))),

    _modulepart: ($) =>
      prec.left(
        seq(
          alias(
            repeat1(seq(alias($._NAME, $.name), optional($._indexvector))),
            $.module,
          ),
          ".",
        ),
      ),

    gatepart: ($) =>
      seq(
        alias($._NAME, $.name),
        optional($._indexvector),
        choice(
          seq(optional($.subgate), alias(optional("++"), $.plusplus)),
          seq(optional($.subgate), $._indexvector),
        ),
      ),

    _loops_and_conditions: ($) =>
      seq($._loop_or_condition, repeat(seq(",", $._loop_or_condition))),

    _loop_or_condition: ($) => choice($.loop, $.condition),

    loop: ($) =>
      choice(
        seq(
          "for",
          alias($._NAME, $.param_name),
          "=",
          alias($._expression, $.from_value),
          "..",
          alias($._expression, $.to_value),
        ),
      ),
    // prec.left(seq('for', /[^{}}]*/, '{', repeat1($.connection), '}'))),

    // connection: $ => choice(
    //   seq($.gatespec, '-->', $.gatespec),
    //   seq($.gatespec, '-->', $._channelspec, '-->', $.gatespec),
    //   seq($.gatespec, '<--', $.gatespec),
    //   seq($.gatespec, '<--', $._channelspec, '<--', $.gatespec),
    //   seq($.gatespec, '<-->', $.gatespec),
    //   seq($.gatespec, '<-->', $._channelspec, '<-->', $.gatespec)
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

    subgate: ($) => choice("$i", "$o"),

    // channelspec: $ => choice(
    //   $._channelspec_header,
    //   seq($._channelspec_header, '{', optional($.parameters), '}')
    // ),

    _channelspec: ($) =>
      choice(
        $._channelspec_header,
        seq($._channelspec_header, "{", optional($._params), "}"),
        seq("{", $._params, "}"),
      ),

    _channelspec_header: ($) =>
      choice(
        alias($.channelname, $.name),
        alias($._dottedname, $.name),
        seq(alias($.channelname, $.name), alias($._dottedname, $.type)),
        seq(
          optional(alias($.channelname, $.name)),
          alias($.likeexpr, $.like_expr),
          "like",
          alias($._dottedname, $.like_type),
        ),
      ),

    channelname: ($) => seq($._NAME, ":"),

    condition: ($) => seq("if", alias($._expression, $.value)),

    ifblock: ($) =>
      seq($.condition, "{", repeat(choice($.connection, $.comment)), "}"),

    forblock: ($) =>
      seq(
        seq($.loop, repeat(seq(",", $.loop))),
        "{",
        repeat(choice($.connection, $.comment)),
        "}",
        optional(";"),
      ),

    sizevector: ($) => seq("[", alias($._expression, $.size), "]"),

    _indexvector: ($) => seq("[", alias($._expression, $.index), "]"),

    _expression: ($) =>
      prec.right(
        10,
        choice(
          $._simple_expr,
          $._functioncall,
          seq($._expression, ".", $._functioncall),
          $.object,
          $.array,
          seq("(", $._expression, ")"),

          seq($._expression, "+", $._expression),
          seq($._expression, "-", $._expression),
          seq($._expression, "*", $._expression),
          seq($._expression, "/", $._expression),
          seq($._expression, "%", $._expression),
          seq($._expression, "^", $._expression),
          seq("-", $._expression),

          seq($._expression, "==", $._expression),
          seq($._expression, "!=", $._expression),
          seq($._expression, ">", $._expression),
          seq($._expression, ">=", $._expression),
          seq($._expression, "<", $._expression),
          seq($._expression, "<=", $._expression),
          seq($._expression, "<=>", $._expression),
          seq($._expression, "match", $._expression),

          seq($._expression, "&&", $._expression),
          seq($._expression, "||", $._expression),
          seq($._expression, "^^", $._expression),

          seq("!", $._expression),

          seq($._expression, "&", $._expression),
          seq($._expression, "|", $._expression),
          seq($._expression, "#", $._expression),

          seq("~", $._expression),
          seq($._expression, "<<", $._expression),
          seq($._expression, ">>", $._expression),

          seq($._expression, "?", $._expression, ":", $._expression),
        ),
      ),

    _functioncall: ($) => seq($._funcname, "(", optional($._exprlist), ")"),

    array: ($) =>
      choice(
        seq("[", "]"),
        seq("[", $._exprlist, "]"),
        seq("[", $._exprlist, ",", "]"),
      ),

    // exprlist: $ => prec.right(choice(
    //   seq($._exprlist, ',', $._expression),
    //   $._expression
    // )),

    object: ($) =>
      choice(
        seq("{", optional($.keyvaluelist), "}"),
        seq($._NAME, "{", optional($.keyvaluelist), "}"),
        seq($._NAME, "::", $._NAME, "{", optional($.keyvaluelist), "}"),
        seq(
          $._NAME,
          "::",
          $._NAME,
          "::",
          $._NAME,
          "{",
          optional($.keyvaluelist),
          "}",
        ),
        seq(
          $._NAME,
          "::",
          $._NAME,
          "::",
          $._NAME,
          "::",
          $._NAME,
          "{",
          optional($.keyvaluelist),
          "}",
        ),
      ),

    _exprlist: ($) =>
      prec.right(seq($._expression, repeat(seq(",", $._expression)))),

    keyvaluelist: ($) => seq($.keyvalue, repeat1(seq(",", $.keyvalue))),

    keyvalue: ($) => seq($.key, ":", $._expression),

    key: ($) =>
      choice(
        $._STRINGCONSTANT,
        $._NAME,
        $._INTCONSTANT,
        $._REALCONSTANT,
        $._quantity,
        seq("-", $._INTCONSTANT),
        seq("-", $._REALCONSTANT),
        seq("-", $._quantity),
        "nan",
        "inf",
        seq("-", "inf"),
        "true",
        "false",
        "null",
        "nullptr",
      ),

    _simple_expr: ($) => choice($._qname, $.operator, $._literal),

    _funcname: ($) =>
      choice(
        $._qname,
        "bool",
        "int",
        "double",
        "string",
        "object",
        "xml",
        "xmldoc",
      ),

    _qname_elem: ($) =>
      prec.right(
        10,
        choice(
          $._NAME,
          seq($._NAME, "[", $._expression, "]"),
          "this",
          "parent",
        ),
      ),

    _qname: ($) =>
      prec.right(seq($._qname_elem, repeat(seq(".", $._qname_elem)))),

    operator: ($) =>
      prec(
        20,
        choice(
          // 'index',
          // 'typename',
          seq($._qname, ".", "index"),
          seq($._qname, ".", "typename"),
          seq("exists", "(", $._qname, ")"),
          seq("sizeof", "(", $._qname, ")"),
        ),
      ),

    _literal: ($) =>
      choice(
        $._STRINGCONSTANT,
        $._XMLCONSTANT,
        $._boolliteral,
        $._numliteral,
        $._otherliteral,
      ),

    _boolliteral: ($) => choice("true", "false"),

    _numliteral: ($) =>
      choice($._INTCONSTANT, $._realconstant_ext, $._quantity),

    _otherliteral: ($) => choice("undefined", "nullptr", "null"),

    // literal: $ => choice(
    //   $.string_literal,
    //   $.bool_literal,
    //   $.num_literal,
    //   $.other_literal
    // ),

    _quantity: ($) =>
      prec(
        10,
        choice(
          seq($._quantity, $._INTCONSTANT, $._NAME),
          seq($._quantity, $._realconstant_ext, $._NAME),
          seq($._quantity, $._intconstant_ext, $._NAME),
          seq($._INTCONSTANT, $._NAME),
          seq($._realconstant_ext, $._NAME),
          seq($._intconstant_ext, $._NAME),
        ),
      ),

    // intconstant_ext: $ => seq(optional($._INTCONSTANT), 'e', $._INTCONSTANT),

    _intconstant_ext: ($) => /[0-9]+e[0-9]*/,

    _realconstant_ext: ($) =>
      choice(
        $._REALCONSTANT,
        "inf",
        "nan",
        $._intconstant_ext,
        seq(".", $._INTCONSTANT),
      ), // last one is a kludge for parsing default(.1s);

    _NAME: ($) => /[_a-zA-Z][_a-zA-Z0-9]*/,
    _PROPNAME: ($) => /[a-zA-Z_][a-zA-Z0-9_:.-]*/,
    _PROPINDEX: ($) => /[a-zA-Z_][a-zA-Z0-9_*?{}:.-]*/,
    _INTCONSTANT: ($) => /\d+/,
    _REALCONSTANT: ($) => /\d+\.\d+/,
    _STRINGCONSTANT: ($) => /"([^"\\]|\\.)*"/,
    _XMLCONSTANT: ($) => /"[^"]*"|'[^']*'/,
    _EMPTYLINE: ($) => /\r?\n\s*\r?\n\s*/,
    // CHARCONSTANT: $ => /'([^'\\]|\\.)'/,
    _COMMONCHAR: ($) => /[^"]/,
    // INVALID_CHAR: $ => /./
  },
});
