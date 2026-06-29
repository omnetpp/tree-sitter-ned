// Expression operator precedence (low binds loosest), mirroring the
// %left/%right declarations in the authoritative NED-2 grammar (ned2.y).
const PREC = {
  TERNARY: 1, // ?:   (right)
  OR: 2, //       ||   (left)
  XOR: 3, //      ##   (left)
  AND: 4, //      &&   (left)
  EQ: 5, //       == != (left)
  REL: 6, //      < > <= >= (left)
  SPACESHIP: 7, //<=>  (left)
  MATCH: 8, //    =~   (left)
  BITOR: 9, //    |    (left)
  BITXOR: 10, //  #    (left)
  BITAND: 11, //  &    (left)
  SHIFT: 12, //   << >> (left)
  ADD: 13, //     + -  (left)
  MUL: 14, //     * / % (left)
  POW: 15, //     ^    (right)
  UNARY: 16, //   - ~ ! (right)
  MEMBER: 17, //  .    (left)
};

module.exports = grammar({
  name: "ned",

  // Comments and blank lines may appear anywhere, so `comment` lives in
  // `extras` (one node per `//` line) instead of being threaded through
  // individual rules. `﻿` lets a leading UTF-8 BOM be skipped (ned2.lex
  // ignores it).
  extras: ($) => [/\s/, /﻿/, $.comment],

  // Identifier token, so reserved words (module, const, this, ...) are split
  // from plain names and never matched as a prefix of a longer identifier.
  word: ($) => $._NAME,

  conflicts: ($) => [[$._dottedname, $._modulepart]],

  rules: {
    nedfile: ($) =>
      prec.right(
        repeat(
          choice(
            $.package,
            $.import,
            $.property_decl,
            alias(seq($._property_namevalue, ";"), $.property),
            $.channel,
            $.channel_interface,
            $.simple,
            $.module,
            $.network,
            $.moduleinterface,
            ";",
          ),
        ),
      ),

    // a single `//` comment line; `\`-continuation extends it to the next line
    comment: ($) => token(seq("//", /(\\+(.|\r?\n)|[^\\\n])*/)),

    package: ($) => seq("package", alias($._dottedname, $.name), ";"),

    _dottedname: ($) => prec.right(seq($._NAME, repeat(seq(".", $._NAME)))),

    import: ($) => seq("import", alias($.importspec, $.name), ";"),

    importspec: ($) =>
      choice(
        $._import_un_qname,
        seq(repeat(seq($._importname, ".")), $._import_un_qname),
      ),

    _import_un_qname: ($) => $._importname,

    _importname: ($) => repeat1(choice($._NAME, "*", "**")),

    property: ($) => $._property_namevalue,

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
        seq("property", "@", field("name", alias($._NAME, $.name)), "[", "]"),
        seq("property", "@", field("name", alias($._NAME, $.name))),
      ),

    property_decl_keys: ($) =>
      seq($.property_decl_key, repeat(seq(";", $.property_decl_key))),

    property_decl_key: ($) => $._property_literal,

    fileproperty: ($) => seq($._property_namevalue, ";"),

    channel: ($) => seq($._channelheader, "{", optional($.parameters), "}"),

    _channelheader: ($) =>
      seq("channel", field("name", alias($._NAME, $.name)), optional($._inheritance)),

    _inheritance: ($) =>
      choice(
        seq("like", $._likenames),
        seq("extends", field("extends", $.extends)),
        seq("extends", field("extends", $.extends), "like", $._likenames),
      ),

    extends: ($) => $._dottedname,

    _likenames: ($) => seq($._likename, repeat(seq(",", $._likename))),

    _likename: ($) => field("implements", alias($._dottedname, $.implements)),

    channel_interface: ($) =>
      seq($._channelinterfaceheader, "{", optional($.parameters), "}"),

    _channelinterfaceheader: ($) =>
      seq("channelinterface", field("name", alias($._NAME, $.name)), optional($._interfaceinheritance)),

    _interfaceinheritance: ($) => seq("extends", $._extendnames),

    _extendnames: ($) => seq(field("extends", $.extends), repeat(seq(",", field("extends", $.extends)))),

    simple: ($) =>
      seq(
        $._simplemoduleheader,
        "{",
        optional($.parameters),
        optional($.gates),
        "}",
      ),

    _simplemoduleheader: ($) =>
      seq("simple", field("name", alias($._NAME, $.name)), optional($._inheritance)),

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
      seq("module", field("name", alias($._NAME, $.name)), optional($._inheritance)),

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
      seq("network", field("name", alias($._NAME, $.name)), optional($._inheritance)),

    moduleinterface: ($) =>
      seq(
        $._moduleinterfaceheader,
        "{",
        optional($.parameters),
        optional($.gates),
        "}",
      ),

    _moduleinterfaceheader: ($) =>
      seq("moduleinterface", field("name", alias($._NAME, $.name)), optional($._interfaceinheritance)),

    parameters: ($) =>
    choice($._params, seq("parameters", ":", $._params), seq("parameters", ":")),

    _params: ($) => repeat1($._paramsitem),

    _paramsitem: ($) =>
      prec.right(
        10,
        seq(choice($.parameter, $.property), ";"),
      ),

    parameter: ($) => choice($._param_typenamevalue, $._parampattern_value),

    _param_typenamevalue: ($) =>
      choice(
        seq($._param_typename, optional($.inline_properties)),
        seq(
          $._param_typename,
          optional($.inline_properties),
          "=",
          field("value", alias($.paramvalue, $.value)),
          optional($.inline_properties),
        ),
      ),

    _param_typename: ($) =>
      choice(
        seq(
          optional(field("volatile", "volatile")),
          field("type", alias($.paramtype, $.type)),
          field("parameter_signature", alias($._NAME, $.name)),
        ),
        field("parameter_signature", alias($._NAME, $.name)),
      ),

    _parampattern_value: ($) =>
      seq(
        $._parampattern,
        optional($.inline_properties),
        "=",
        field("value", alias($.paramvalue, $.value)),
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

    inline_properties: ($) => repeat1($._inline_property_namevalue),

    _parampattern: ($) => field("parameter_signature", $.pattern),

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
        field("property_signature", $._property_name),
        prec.right(seq(field("property_signature", $._property_name), "(", optional($._property_tags), ")")),
      ),

    _inline_property_namevalue: ($) =>
      choice(
        $._property_name,
        prec.right(seq($._property_name, "(", optional($._property_tags), ")")),
      ),

    _property_name: ($) =>
      prec.right(
        choice(
          seq("@", alias($._PROPNAME, $.name)),
          seq(
            "@",
            alias($._PROPNAME, $.name),
            "[",
            alias($._PROPINDEX, $.index),
            "]",
          ),
        ),
      ),

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

    property_values: ($) =>
      prec.right(seq($._property_value, repeat(seq(",", $._property_value)))),

    _property_value: ($) => $._property_literal,

    _property_literal: ($) =>
      repeat1(
        seq(
          choice(
            $._COMMONCHAR,
            $._STRINGCONSTANT,
            seq("(", $._property_literal, ")"),
          ),
        ),
      ),

    gates: ($) => seq("gates", ":", repeat($.gate)),

    gate: ($) =>
      seq(
        $._gate_typenamesize,
        optional($.inline_properties),
        ";",
      ),

    _gate_typenamesize: ($) =>
      choice(
        seq($._gatetype, field("name", alias($._NAME, $.name))),
        seq($._gatetype, field("name", alias($._NAME, $.name)), field("vector", alias("[]", $.vector))),
        seq($._gatetype, field("name", alias($._NAME, $.name)), field("vector", alias($.sizevector, $.vector))),
        field("name", alias($._NAME, $.name)),
        seq(field("name", alias($._NAME, $.name)), "[", "]"),
        seq(field("name", alias($._NAME, $.name)), field("vector", alias($.sizevector, $.vector))),
      ),

    _gatetype: ($) => field("direction", alias(choice("input", "output", "inout"), $.type)),

    types: ($) => seq("types", ":", repeat($._localtypes)),

    _localtypes: ($) => prec.right(repeat1($._localtype)),

    _localtype: ($) =>
      choice(
        $.property_decl,
        $.channel,
        $.channel_interface,
        $.simple,
        $.module,
        $.network,
        $.moduleinterface,
        ";",
      ),

    submodules: ($) =>
      seq(
        "submodules",
        ":",
        prec.right(repeat($.submodule)),
      ),

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
            field("type", alias($._dottedname, $.type)),
            optional(field("condition", $.condition)),
          ),
          seq(
            $._submodulename,
            ":",
            field("like_expr", alias($.likeexpr, $.like_expr)),
            "like",
            field("like_type", alias($._dottedname, $.like_type)),
            optional(field("condition", $.condition)),
          ),
        ),
      ),

    _submodulename: ($) =>
      prec.right(
        choice(
          field("name", alias($._NAME, $.name)),
          seq(field("name", alias($._NAME, $.name)), field("vector", alias($.sizevector, $.vector))),
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
            ),
          ),
        ),
      ),

    connection: ($) =>
      prec.right(
        choice(
          seq(
            field("src", alias($.connectionname, $.src)),
            field("arrow", $.arrow),
            field("dest", alias($.connectionname, $.dest)),
            optional($._loops_and_conditions),
            ";",
          ),
          seq(
            field("src", alias($.connectionname, $.src)),
            field("arrow", $.arrow),
            $._channelspec,
            field("arrow", $.arrow),
            field("dest", alias($.connectionname, $.dest)),
            optional($._loops_and_conditions),
            ";",
          ),
        ),
      ),

    arrow: ($) => choice("-->", "<--", "<-->"),

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
        optional($.subgate),
        optional(choice($._indexvector, alias("++", $.plusplus))),
      ),

    _loops_and_conditions: ($) =>
      seq($._loop_or_condition, repeat(seq(",", $._loop_or_condition))),

    _loop_or_condition: ($) => choice($.loop, $.condition),

    loop: ($) =>
      seq(
        "for",
        field("param_name", alias($._NAME, $.param_name)),
        "=",
        field("from_value", alias($._expression, $.from_value)),
        "..",
        field("to_value", alias($._expression, $.to_value)),
      ),

    subgate: ($) => choice("$i", "$o"),

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
      seq($.condition, "{", repeat($.connection), "}"),

    forblock: ($) =>
      seq(
        seq($.loop, repeat(seq(",", $.loop))),
        "{",
        repeat($.connection),
        "}",
        optional(";"),
      ),

    sizevector: ($) => seq("[", alias($._expression, $.size), "]"),

    _indexvector: ($) => seq("[", alias($._expression, $.index), "]"),

    // Operator precedence and associativity mirror the authoritative NED-2
    // grammar (src/nedxml/ned2.y): low number = binds loosest.
    _expression: ($) =>
      choice(
        $._simple_expr,
        $.call,
        $.member_call,
        $.object,
        $.array,
        $.parenthesized_expression,
        $.unary_expression,
        $.binary_expression,
        $.conditional_expression,
      ),

    parenthesized_expression: ($) => seq("(", $._expression, ")"),

    // method call on an expression, e.g. `this.getParentModule().foo()`
    member_call: ($) =>
      prec.left(PREC.MEMBER, seq($._expression, ".", $.call)),

    unary_expression: ($) =>
      prec.right(
        PREC.UNARY,
        seq(field("operator", choice("-", "!", "~")), field("operand", $._expression)),
      ),

    binary_expression: ($) => {
      const table = [
        ["+", PREC.ADD],
        ["-", PREC.ADD],
        ["*", PREC.MUL],
        ["/", PREC.MUL],
        ["%", PREC.MUL],
        ["==", PREC.EQ],
        ["!=", PREC.EQ],
        [">", PREC.REL],
        [">=", PREC.REL],
        ["<", PREC.REL],
        ["<=", PREC.REL],
        ["<=>", PREC.SPACESHIP],
        ["=~", PREC.MATCH],
        ["&&", PREC.AND],
        ["||", PREC.OR],
        ["##", PREC.XOR],
        ["&", PREC.BITAND],
        ["|", PREC.BITOR],
        ["#", PREC.BITXOR],
        ["<<", PREC.SHIFT],
        [">>", PREC.SHIFT],
      ];
      return choice(
        ...table.map(([op, p]) =>
          prec.left(
            p,
            seq(
              field("left", $._expression),
              field("operator", op),
              field("right", $._expression),
            ),
          ),
        ),
        // exponentiation is right-associative
        prec.right(
          PREC.POW,
          seq(
            field("left", $._expression),
            field("operator", "^"),
            field("right", $._expression),
          ),
        ),
      );
    },

    conditional_expression: ($) =>
      prec.right(
        PREC.TERNARY,
        seq(
          field("condition", $._expression),
          "?",
          field("consequence", $._expression),
          ":",
          field("alternative", $._expression),
        ),
      ),

    call: ($) => seq($._funcname, "(", optional($._exprlist), ")"),

    array: ($) =>
      choice(
        seq("[", "]"),
        seq("[", $._exprlist, "]"),
        seq("[", $._exprlist, ",", "]"),
      ),

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
        $.quantity,
        seq("-", $._INTCONSTANT),
        seq("-", $._REALCONSTANT),
        seq("-", $.quantity),
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
          "index",
          "typename",
          seq($._qname, ".", "index"),
          seq($._qname, ".", "typename"),
          seq("exists", "(", $._qname, ")"),
          seq("sizeof", "(", $._qname, ")"),
        ),
      ),

    _literal: ($) =>
      choice(
        alias($._STRINGCONSTANT, $.string),
        alias($._boolliteral, $.boolean),
        $._numliteral,
        alias($._otherliteral, $.constant),
      ),

    _boolliteral: ($) => choice("true", "false"),

    _numliteral: ($) =>
      choice(
        alias($._INTCONSTANT, $.number),
        alias($._realconstant_ext, $.number),
        $.quantity,
      ),

    _otherliteral: ($) => choice("undefined", "nullptr", "null"),

    quantity: ($) =>
      prec(
        10,
        choice(
          seq($.quantity, $._INTCONSTANT, $._NAME),
          seq($.quantity, $._realconstant_ext, $._NAME),
          seq($._INTCONSTANT, $._NAME),
          seq($._realconstant_ext, $._NAME),
        ),
      ),

    _realconstant_ext: ($) => choice($._REALCONSTANT, "inf", "nan"),

    _NAME: ($) => /[_a-zA-Z][_a-zA-Z0-9]*/,
    _PROPNAME: ($) => /[a-zA-Z_][a-zA-Z0-9_:.-]*/,
    _PROPINDEX: ($) => /[a-zA-Z0-9_*?{}:.-]+/,
    _INTCONSTANT: ($) => /\d+|0[xX][0-9a-fA-F]+/,
    _REALCONSTANT: ($) => /(\d+[eE][+-]?\d+)|(\d*\.\d+([eE][+-]?\d+)?)/,
    // Both `"..."` and `'...'` are string constants in NED, with `\`-escapes
    // and `\`-newline line continuation (see ned2.lex stringliteral states).
    _STRINGCONSTANT: ($) =>
      choice(/"([^"\\]|\\(.|\r?\n))*"/, /'([^'\\]|\\(.|\r?\n))*'/),
    _COMMONCHAR: ($) => /[^"]/,
  },
});
