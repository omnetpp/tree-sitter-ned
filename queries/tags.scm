; Code-navigation tags for NED.
; Definitions: NED types (modules, channels, networks, interfaces) and the
; submodules they instantiate. References: inheritance and instantiation.

(simple name: (name) @name) @definition.class
(module name: (name) @name) @definition.class
(network name: (name) @name) @definition.class
(channel name: (name) @name) @definition.class

(moduleinterface name: (name) @name) @definition.interface
(channel_interface name: (name) @name) @definition.interface

; Submodule instances
(submodule name: (name) @name) @definition.field

; Inheritance / interface references
(extends) @name @reference.class
(implements) @name @reference.implementation
(like_type) @name @reference.class

; Submodule type references
(submodule type: (type) @name) @reference.class

; Function / method calls
(call (name) @name) @reference.call
