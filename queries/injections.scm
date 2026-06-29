; Inject the XML grammar into the string argument of an `xmldoc("...")` call,
; e.g. `xmlConfig = xmldoc("<config/>");`
(call
  "xmldoc"
  (string) @injection.content
  (#set! injection.language "xml")
  (#set! injection.include-children false))
