; Indentation hints (nvim-treesitter format). Blocks delimited by `{`/`}`
; (and the `:`-introduced sections) indent their contents.

[
  (simple)
  (module)
  (network)
  (channel)
  (channel_interface)
  (moduleinterface)
  (parameters)
  (gates)
  (types)
  (submodules)
  (connections)
  (submodule)
  (connection_group)
  (object)
  (array)
] @indent.begin

[ "}" "]" ")" ] @indent.branch
[ "}" "]" ")" ] @indent.end
