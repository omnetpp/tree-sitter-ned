; Scopes and local bindings, for scope-aware highlighting and rename.

; Compound types and connection groups open a scope
(simple) @local.scope
(module) @local.scope
(network) @local.scope
(moduleinterface) @local.scope
(channel) @local.scope
(channel_interface) @local.scope
(connection_group) @local.scope

; Definitions visible within the enclosing type
(submodule name: (name) @local.definition)
(parameter parameter_signature: (name) @local.definition)
(gate name: (name) @local.definition)

; for-loop index variable, scoped to its connection group
(loop param_name: (param_name) @local.definition)
