module.exports = grammar({
  name: 'ned',

  extras: $ => [
    /\s/,
    $.comment,
  ],

  rules: {
    nedfile: $ => optional($.definitions),

    definitions: $ => choice(
      seq($.definitions, $.definition),
      $.definition
    ), 
    
    definition: $ => choice(
      $.packagedeclaration,
      $.import,
      $.propertydecl,
      $.fileproperty,
      $.channeldefinition,
      $.channelinterfacedefinition,
      $.simplemoduledefinition,
      $.compoundmoduledefinition,
      $.networkdefinition,
      $.moduleinterfacedefinition,
      ';'
    ),
    

    packagedeclaration: $ => seq(
      'PACKAGE',
      $.dottedname,
      ';'
    ),

    dottedname: $ => seq($.NAME, repeat(seq('.', $.NAME))),

    import: $ => seq(
      'IMPORT',
      $.importspec,
      ';'
    ),

    importspec: $ => choice(
      seq($.importspec, '.', $.importname),
      $.importname
    ),

    importname: $ => choice(
      seq($.importname, $.NAME),
      seq($.importname, '*'),
      seq($.importname, '**'),
      $.NAME,
      '*',
      '**'
    ),

    property: $ => seq(
      $.property_namevalue,
      ';'
    ),
    
    propertydecl: $ => choice(
      seq($.propertydecl_header, optional($.inline_properties), ';'),
      seq($.propertydecl_header, '(', optional($.propertydecl_keys), ')', optional($.inline_properties), ';')
    ),

    propertydecl_header: $ => choice(
      seq('PROPERTY', '@', $.PROPNAME, '[', ']'),
      seq('PROPERTY', '@', $.PROPNAME)
    ),
    
    propertydecl_keys: $ => seq(
      choice($.propertydecl_keys, $.propertydecl_key),
      ';',
      $.propertydecl_key
    ),

    propertydecl_key: $ => $.property_literal,

    fileproperty: $ => seq(
      $.property_namevalue,
      ';'
    ),

    channeldefinition: $ => seq(
      $.channelheader,
      '{',
      $.opt_paramblock,
      '}'
    ),
    
    channelheader: $ => seq(
      'CHANNEL',
      $.NAME,
      $.opt_inheritance
    ),

    opt_inheritance: $ => choice(
      // %empty rule can be represented by an empty sequence or omitted entirely
      // depending on how you structure your grammar rules.
      // In Tree-sitter, absence of a rule implies optional nature.
      // $.EXTENDS,
      seq('like', $.likenames),
      seq('extends', $.extendsname),
      seq('extends', $.extendsname, 'like', $.likenames)
    ),
    
    extendsname: $ => $.dottedname,

    likenames: $ => prec.left(choice(
      seq(
        $.likenames,
        ',',
        $.likename
    )),
    $.likename),

    likename: $ => $.dottedname,

    channelinterfacedefinition: $ => seq(
      $.channelinterfaceheader,
      '{',
      $.opt_paramblock,
      '}'
    ),

    channelinterfaceheader: $ => seq(
      'channelinterface',
      $.NAME,
      $.opt_interfaceinheritance
    ),

    opt_interfaceinheritance: $ => choice(
      seq('EXTENDS', $.extendsnames),
      // %empty rule can be represented by an empty sequence or omitted entirely
      // depending on how you structure your grammar rules.
      // In Tree-sitter, absence of a rule implies optional nature.
    ),
    
    extendsnames: $ => prec.left(choice(
      seq(
        $.extendsnames,
        ',',
        $.extendsname
    )),
    $.extendsname),

    simplemoduledefinition: $ => seq(
      $.simplemoduleheader,
      '{',
      $.opt_paramblock,
      optional($.gateblock),
      '}'
    ),

    simplemoduleheader: $ => seq(
      'simple',
      $.NAME,
      $.opt_inheritance
    ),

    compoundmoduledefinition: $ => seq(
      $.compoundmoduleheader,
      '{',
      $.opt_paramblock,
      optional($.gateblock),
      optional($.typeblock),
      optional($.submodblock),
      optional($.connblock),
      '}'
    ),

    compoundmoduleheader: $ => seq(
      'module',
      $.NAME,
      $.opt_inheritance
    ),

    networkdefinition: $ => seq(
      $.networkheader,
      '{',
      $.opt_paramblock,
      optional($.gateblock),
      optional($.typeblock),
      optional($.submodblock),
      optional($.connblock),
      '}'
    ),

    networkheader: $ => seq(
      'NETWORK',
      $.NAME,
      $.opt_inheritance
    ),

    moduleinterfacedefinition: $ => seq(
      $.moduleinterfaceheader,
      '{',
      $.opt_paramblock,
      optional($.gateblock),
      '}'
    ),

    moduleinterfaceheader: $ => seq(
      'moduleinterface',
      $.NAME,
      $.opt_interfaceinheritance
    ),

    opt_paramblock: $ => choice(
      seq(
        optional($.params),
        optional(
          seq(
            'parameters',
            ':',
            optional($.params)
          )
        )
      ),
      seq(
        'parameters',
        ':',
        optional($.params)
      )
    ),

    params: $ => choice(
      seq($.params, $.paramsitem),
      $.paramsitem
    ),

    paramsitem: $ => choice($.param, $.property),

    // TODO opt_paramblock: optional(params)
    
    param: $ => choice(
      $.param_typenamevalue,
      $.parampattern_value
    ),
    
    param_typenamevalue: $ => choice(
      seq(
        $.param_typename,
        optional($.inline_properties),
        ';'
      ),
      seq(
        $.param_typename,
        optional($.inline_properties),
        '=',
        $.paramvalue,
        optional($.inline_properties),
        ';'
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
      $.paramvalue,
      ';'
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
    
    paramvalue: $ => choice(
      $.expression,
      seq('default', '(', $.expression, ')'),
      'default',
      'ask'
    ),
    
    // opt_inline_properties
    
    inline_properties: $ => choice(
      $.property_namevalue,
      seq($.inline_properties, $.property_namevalue)
    ),

    parampattern: $ => $.pattern,
    
    pattern: $ =>
      choice(
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
      seq($.NAME, '$', $.NAME),
      $.NAME,
      'channel',
      seq('{', $.pattern_index, '}'),
      '*',
      seq($.pattern_name, $.NAME),
      seq($.pattern_name, '{', $.pattern_index, '}'),
      seq($.pattern_name, '*')
    )),
    
    pattern_index: $ => choice(
      $.INTCONSTANT,
      seq($.INTCONSTANT, '..', $.INTCONSTANT),
      seq('..', $.INTCONSTANT),
      seq($.INTCONSTANT, '..')
    ),

    property_namevalue: $ =>
      choice(
        $.property_name,
        seq($.property_name, '(', optional($.property_keys), ')')
    ),
    
    property_name: $ =>
      choice(
        seq('@', $.PROPNAME, {
          // Action to handle adding property based on parsed data
          // ps.property = addProperty(...)
        }),
        seq('@', $.PROPNAME, '[', $.PROPNAME, ']', {
          // Action to handle adding indexed property based on parsed data
          // ps.property = addProperty(...)
          // ps.property->setIndex(...)
        })
    ),

    // optional($.property_keys)

    property_keys: $ =>
      choice(
        seq($.property_keys, ';', $.property_key),
        $.property_key
    ),

    property_key: $ =>
      choice(
        seq(
          $.property_literal,
          '=',
          $.property_values,
          {
            // Action to create and manipulate PropertyKeyElement based on parsed data
            // ps.propkey = createNedElementWithTag(...)
            // ps.propkey->setName(...)
            // ps.propkey->appendChild(...)
            // storePos(...)
          }
        ),
        seq(
          $.property_values,
          {
            // Action to create and manipulate PropertyKeyElement based on parsed data
            // ps.propkey = createNedElementWithTag(...)
            // ps.propkey->appendChild(...)
            // storePos(...)
          }
        )
      ),

      property_values: $ =>
        choice(
          seq($.property_values, ',', $.property_value, {
            // Action to handle pushing the parsed property value to ps.propvals
            // ps.propvals.push_back(...)
          }),
          $.property_value, {
            // Action to handle pushing the parsed property value to ps.propvals
            // ps.propvals.push_back(...)
          }
      ),

      property_value: $ =>
        choice(
          $.property_literal, {
            // Action to create a PropertyValueElement based on parsed data
            // $$ = createPropertyValue(np, @$);
          },
          '%empty', {
            // Action to create an empty LiteralElement
            // LiteralElement *node = (LiteralElement *)createNedElementWithTag(np, NED_LITERAL);
            // node->setType(LIT_SPEC);
            // $$ = node;
          }
      ),

      property_literal: $ =>
        choice(
          seq($.property_literal, $.COMMONCHAR),
          seq($.property_literal, $.STRINGCONSTANT),
          $.COMMONCHAR,
          $.STRINGCONSTANT
      ),
      
      // opt_gateblock

      gateblock: $ => seq('gates', ':', optional($.gates)),
      
      gates: $ =>
        choice(
          seq($.gates, $.gate),
          $.gate
      ),

      gate: $ =>
        seq($.gate_typenamesize, optional($.inline_properties), ';'),

      gate_typenamesize: $ =>
        choice(
          seq($.gatetype, $.NAME),                        // gatetype NAME
          seq($.gatetype, $.NAME, '[', ']',),          // gatetype NAME '[' ']'
          seq($.gatetype, $.NAME, $.vector),              // gatetype NAME vector
          $.NAME,                                         // NAME
          seq($.NAME, '[', ']',),                      // NAME '[' ']'
          seq($.NAME, $.vector)                           // NAME vector
      ),

      gatetype: $ => choice('input', 'output', 'inout'),

      // opt_typeblock
      
      typeblock: $ =>
        seq(
          'types', ':',
          $.opt_localtypes
      ),
      
      // opt_localtypes

      localtypes: $ =>
        repeat1(
          $.localtype
      ),

      localtype: $ =>
        choice(
          $.propertydecl,
          $.channeldefinition,
          $.channelinterfacedefinition,
          $.simplemoduledefinition,
          $.compoundmoduledefinition,
          $.networkdefinition,
          $.moduleinterfacedefinition,
          ';'
      ),
      
      // opt_submodblock

      submodblock: $ =>
        seq(
          'submodules',
          ':',
          $.opt_submodules
      ),

      // opt_submodules

      submodules: $ =>
        repeat1($.submodule),

      submodule: $ => choice(
        seq($.submoduleheader, ';'),
        seq(
          $.submoduleheader,
          '{',
          optional($.opt_paramblock),
          optional(optional($.gateblock)),
          '}',
          optional($.opt_semicolon)
        )
      ),

      submoduleheader: $ => choice(
        seq($.submodulename, ':', $.dottedname, optional($.opt_condition)),
        seq($.submodulename, ':', $.likeexpr, 'like', $.dottedname, optional($.opt_condition))
      ),

      submodulename: $ => choice($.NAME, seq($.NAME, $.vector)),

      // opt_condition

      likeexpr: $ => choice(
        seq('<', '>'),
        seq('<', $.expression, '>'),
        seq('<', 'default', '(', $.expression, ')', '>'),
      ),

      // opt_connblock

      connblock: $ => choice(
        seq('connections', 'allowunconnected', ':', $.opt_connections),
        seq('connections', ':', $.opt_connections)
      ),

      // opt_connections

      connections: $ => choice(
        seq($.connections, $.connectionitem),
        $.connectionitem
      ),

      connectionsitem: $ => choice(
        $.connectiongroup,
        seq($.connection, $.opt_loops_and_conditions, ';')
      ),

      connectiongroup: $ => seq(
        $.opt_loops_and_conditions,
        '{',
        $.connections,
        '}',
        $.opt_semicolon
      ),

      // opt_loops_and_conditions

      loops_and_conditions: $ => seq(
        $.loop_or_condition,
        repeat(seq(',', $.loop_or_condition))
      ),

      loop_or_condition: $ => choice($.loop, $.condition),

      loop: $ => seq(
        'for',
        $.NAME,
        '=',
        $.expression,
        'to',
        $.expression
      ),

      connection: $ => choice(
        seq($.leftgatespec, '-->', $.rightgatespec),
        seq($.leftgatespec, '-->', $.channelspec, '-->', $.rightgatespec),
        seq($.leftgatespec, '<--', $.rightgatespec),
        seq($.leftgatespec, '<--', $.channelspec, '<--', $.rightgatespec),
        seq($.leftgatespec, '<-->', $.rightgatespec),
        seq($.leftgatespec, '<-->', $.channelspec, '<-->', $.rightgatespec)
      ),

      leftgatespec: $ => choice(
        seq($.leftmod, '.', $.leftgate),
        $.parentleftgate
      ),

      leftmod: $ => choice(
        seq($.NAME, $.vector),
        $.NAME
      ),

      leftgate: $ => choice(
        seq($.NAME, $.opt_subgate),
        seq($.NAME, $.opt_subgate, $.vector),
        seq($.NAME, $.opt_subgate, '++')
      ),

      parentleftgate: $ => choice(
        seq($.NAME, $.opt_subgate),
        seq($.NAME, $.opt_subgate, $.vector),
        seq($.NAME, $.opt_subgate, '++')
      ),

      rightgatespec: $ => choice(
        seq($.rightmod, '.', $.rightgate),
        $.parentrightgate
      ),

      rightgate: $ => choice(
        seq($.NAME, optional($.subgate)),
        seq($.NAME, optional($.subgate), $.vector),
        seq($.NAME, optional($.subgate), '++')
      ),

      parentrightgate: $ => choice(
        seq($.NAME, optional($.subgate)),
        seq($.NAME, optional($.subgate), $.vector),
        seq($.NAME, optional($.subgate), '++')
      ),

      // opt_subgate

      subgate: $ => choice('$i', '$o'),

      channelspec: $ => choice(
        $.channelspec_header,
        seq($.channelspec_header, '{', optional('opt_paramblock'), '}')
      ),

      channelspec_header: $ => choice(
        optional($.channelname),
        seq($.opt_channelname, $.dottedname),
        seq($.opt_channelname, $.likeexpr, LIKE, $.dottedname)
      ),
      

      channelname: $ => seq($.NAME, ':'),

      // opt_channelname

      condition: $ => seq('if', $.expression),

      vector: $ => seq('[', $.expression, ']'),

      expression: $ => choice(
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
      ),

      functioncall: $ => seq($.funcname, '(', optional($.exprlist), ')'),

      array: $ => choice(
        seq('[', ']'),
        seq('[', $.explist, ']'),
        seq('[', $.explist, ',', ']'),
      ),

      object: $ => choice(
        seq('{', $.opt_keyvaluelist, '}'),
        seq($.NAME, '{', $.opt_keyvaluelist, '}'),
        seq($.NAME, '::', $.NAME, '{', $.opt_keyvaluelist, '}'),
        seq($.NAME, '::', $.NAME, '::', $.NAME, '{', $.opt_keyvaluelist, '}'),
        seq($.NAME, '::', $.NAME, '::', $.NAME, '::', $.NAME, '{', $.opt_keyvaluelist, '}')
      ),

      exprlist: $ => seq($.expression, repeat(seq(',', $.expression))),

      keyvaluelist: $ => seq($.keyvalue, repeat(',', $.keyvalue)),

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
        $.NAME,
        'bool',
        'int',
        'double',
        'string',
        'object',
        'xml',
        'xmldoc'
      ),

      qname_elem: $ => choice(
        $.NAME,
        seq($.NAME, '[', $.expr, ']'),
        'this',
        'parent'
      ),

      qname: $ => seq($.qname_elem, repeat(seq(',', $.qname_elem))),
      
      operator: $ => choice(
        'index',
        'typename',
        seq($.qname, '.', 'index'),
        seq($.qname, '.', 'typename'),
        seq('exists', '(', $.qname, ')'),
        seq('sizeof', '(', $.qname, ')')
      ),

      literal: $ => choice(
        $.STRINGCONSTANT,
        $.boolliteral,
        $.numliteral,
        $.otherliteral
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

      quantity: $ => choice(
        seq($.quantity, $.INTCONSTANT, $.NAME),
        seq($.quantity, $.realconstant_ext, $.NAME),
        seq($.INTCONSTANT, $.NAME),
        seq($.realconstant_ext, $.NAME)
      ),

      realconstant_ext: $ => choice($.REALCONSTANT, 'inf', 'nan'),

      // opt_semicolon

      NAME: $ => /[_a-zA-Z][_a-zA-Z0-9]*/,
      PROPNAME: $ => /[_a-zA-Z][_a-zA-Z0-9]*/,
      INTCONSTANT: $ => /\d+/,
      REALCONSTANT: $ => /\d+\.\d+/,
      STRINGCONSTANT: $ => /"([^"\\]|\\.)*"/,
      CHARCONSTANT: $ => /'([^'\\]|\\.)'/,
      DOUBLEASTERISK: $ => '**',
      PLUSPLUS: $ => '++',
      EQ: $ => '==',
      NE: $ => '!=',
      GE: $ => '>=',
      LE: $ => '<=',
      SPACESHIP: $ => '<=>',
      AND: $ => '&&',
      OR: $ => '||',
      XOR: $ => '^^',
      SHIFT_LEFT: $ => '<<',
      SHIFT_RIGHT: $ => '>>',
      DOUBLECOLON: $ => '::',
      EXPRESSION_SELECTOR: $ => /[_a-zA-Z][_a-zA-Z0-9]*/,
      COMMONCHAR: $ => /./,
      INVALID_CHAR: $ => /./  
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
    
    
    

    


    
  }
});
