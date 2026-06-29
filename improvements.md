# tree-sitter-ned — Improvement Report

This report analyzes the current tree-sitter grammar (`grammar.js`) against the
authoritative OMNeT++ NED-2 grammar and lexer (`src/nedxml/ned2.y` and
`src/nedxml/ned2.lex`), and recommends improvements so downstream tools
(editors, linters, doc generators, code navigation) can rely on the parser more
fully.

The current grammar is a solid foundation and parses real-world INET / Simu5G /
Veins files (see `test/corpus/Regression`). The issues below are ordered by
impact. Each item references the relevant lines in `grammar.js` and the
authoritative source.

---

## Resolution status (all items addressed)

All issues below have been implemented in `grammar.js`, regenerated into
`src/`, and covered by tests. The full suite (`tree-sitter test`) passes 30/30,
and all six query files compile against the grammar.

| Item | Status | Notes |
|------|--------|-------|
| 1.1 `^^`→`##` (XOR) | ✅ Fixed | now `##`; `^^` removed |
| 1.2 `match`→`=~` | ✅ Fixed | now `=~`; `match` keyword removed |
| 1.3 Hex integers | ✅ Fixed | `_INTCONSTANT` accepts `0x…` |
| 1.4 Real exponents | ✅ Fixed | `_REALCONSTANT` handles `E`, sign, leading dot; ad-hoc kludges removed |
| 1.5 Bare `index`/`typename` | ✅ Fixed | added to `operator` |
| 1.6 Empty file | ✅ Fixed | `nedfile` uses `repeat` |
| 1.7 Subgate/vector order | ✅ Fixed | `gatepart` = name subgate? (vector\|`++`)? |
| 1.8 Bare `extends` | ✅ Fixed | removed the no-name alternative |
| 1.9 Multi-line strings | ✅ Fixed | `\`-newline continuation in `_STRINGCONSTANT` |
| 2 Operator precedence | ✅ Fixed | full `PREC` table; named `binary_expression`/`unary_expression`/`conditional_expression`/`member_call`/`call`/`parenthesized_expression` with `left`/`right`/`operator`/`operand`/`condition`/… fields |
| 3 `field()` coverage | ✅ Fixed | name/type/extends/implements/like_type/like_expr/condition/src/dest/arrow/value/volatile/direction/vector/param_name/from_value/to_value + expression fields |
| 4 Navigation queries | ✅ Added | `tags.scm`, `locals.scm`, `injections.scm` (xml into `xmldoc`), `folds.scm`, `indents.scm`; `highlights.scm` greatly expanded; literals exposed as named `string`/`number`/`boolean`/`quantity`/`constant` nodes |
| 5 Lexer fidelity | ✅ Mostly | unified `'…'`/`"…"` strings (retired `_XMLCONSTANT`); widened `_PROPINDEX`; UTF-8 BOM in `extras`; `word: $._NAME` for keyword/identifier separation. Property-value `_COMMONCHAR` left as-is (see note) |
| 6 Comment handling | ✅ Fixed | single `comment` token in `extras` (works everywhere); dropped `_EMPTYLINE`/`inline_comment` special-casing |
| 7 Test coverage | ✅ Added | `test/corpus/Features` covers operators, numbers, precedence, empty/comment-only files, multi-line/single-quoted strings, `this`/`parent`/`sizeof`/`exists`, channel interface, property decl, `allowunconnected` + inline channel `like` |

**Deferred (documented):** the property-value capture (`_COMMONCHAR`, §5) is
unchanged. A faithful fix requires an external scanner replicating ned2.lex's
stateful `propertyvalue` mode with paren-depth tracking; the current rule parses
all real-world corpus files correctly, so this was left as a known limitation
rather than risk a regression.

Also done as part of §4: `channelinterfaceheader` was made hidden
(`_channelinterfaceheader`) so its `name` field hoists onto `channel_interface`,
matching the other type headers.

---

---

## 1. Correctness bugs (valid NED rejected, or invalid NED accepted)

These cause real files to misparse, which directly breaks any tool built on top.

### 1.1 Wrong logical-XOR operator: `^^` instead of `##`  — **HIGH**
`grammar.js:572` defines XOR as `^^`. NED has no `^^` operator. The real logical
XOR token is `##` (`ned2.lex:204`: `"##" → XOR`, `ned2.y:1549`). Consequences:
- `a ## b` (valid) **fails to parse**.
- `a ^^ b` (invalid) is **wrongly accepted**.

Fix: replace `"^^"` with `"##"` in the expression rule.

### 1.2 Wrong match operator: `match` keyword instead of `=~`  — **HIGH**
`grammar.js:568` uses a `match` keyword. NED's pattern-match operator is `=~`
(`ned2.lex:228`: `"=~" → MATCH`, `ned2.y:1545`). There is no `match` keyword in
the lexer. Consequences:
- `a =~ "pattern"` (valid) **fails to parse**.
- `a match b` parses, but `match` is actually just a `NAME` in NED, so this is
  wrong.

Fix: replace `"match"` with `"=~"`.

### 1.3 Hexadecimal integer literals not supported  — **HIGH**
`_INTCONSTANT` is `/\d+/` (`grammar.js:734`). The lexer also accepts hex:
`0[xX]{X}+` (`ned2.lex:129`). So `0xFF`, `0x1A2B` **fail to parse**.

Fix: `_INTCONSTANT: $ => /\d+|0[xX][0-9a-fA-F]+/`.

### 1.4 Real-number exponent notation is incomplete  — **HIGH**
The lexer real-number rules are (`ned2.lex:24,130–131`):
```
E  [Ee][+-]?{D}+
{D}+{E}              → REALCONSTANT      e.g. 1e10, 2E+8
{D}*"."{D}+({E})?    → REALCONSTANT      e.g. .5, 1.5e-3, 2.5e8
```
The tree-sitter side (`grammar.js:720–735`) only has:
- `_REALCONSTANT: /\d+\.\d+/` — no exponent at all,
- `_intconstant_ext: /[0-9]+e[0-9]*/` — lowercase `e` only, **no sign**, and
  allows a malformed empty exponent (`1e`).

Consequences — these valid literals misparse:
- `2.5e8`, `1.5e-3`, `6.022e23` (real + exponent) → `2.5` parses, `e8` becomes a
  `NAME`.
- `1E10`, `2e+8` (uppercase `E` / `+` sign) → fail.

This also breaks quantities like `1.5e-3s`. The corpus only tests integer
exponents (`LargeNet.ned … 2e8`), masking the gap.

Fix: model numbers after the lexer, e.g.
```js
_INTCONSTANT:  $ => /\d+|0[xX][0-9a-fA-F]+/,
_REALCONSTANT: $ => /(\d+[eE][+-]?\d+)|(\d*\.\d+([eE][+-]?\d+)?)/,
```
and drop the ad-hoc `_intconstant_ext` / `.`-kludge once the regex is correct.

### 1.5 Standalone `index` and `typename` operators missing  — **MEDIUM**
`operator` (`grammar.js:680`) only models `qname.index`, `qname.typename`,
`exists(...)`, `sizeof(...)`. The authoritative `operator` rule
(`ned2.y:1655–1662`) also allows **bare** `INDEX_` and `TYPENAME`:
```
operator : INDEX_ | TYPENAME | qname '.' INDEX_ | qname '.' TYPENAME | …
```
So a parameter value of just `index` or `typename` (common, e.g.
`address = index;` or `= typename`) **fails to parse**.

Fix: add `"index"` and `"typename"` as standalone alternatives in `operator`.

### 1.6 Empty / comment-only / whitespace-only files fail  — **MEDIUM**
`nedfile` uses `repeat1(...)` (`grammar.js:11`), requiring at least one element.
The authoritative grammar allows an empty file (`ned2.y:219–222`: `nedfile :
definitions | %empty`). An empty `.ned` file, or one containing only whitespace,
is a valid NED file but produces a parse error here.

Fix: use `repeat(...)` for the file body.

### 1.7 Subgate / vector ordering accepts invalid gates  — **LOW**
In `gatepart` (`grammar.js:475–483`) an index vector may appear *before* the
subgate, so `gate[0]$i` is accepted. NED requires the subgate first:
`NAME opt_subgate vector` (`ned2.y:1343`), i.e. `gate$i[0]`. The valid form still
parses, but the invalid order is also accepted (over-acceptance).

### 1.8 Stray bare `extends` accepted  — **LOW**
`_inheritance` (`grammar.js:85–91`) includes a lone `"extends"` alternative with
no type name, which is invalid NED. The authoritative `opt_inheritance`
(`ned2.y:406–411`) never allows `extends` without a name.

### 1.9 Multi-line string literals not supported  — **LOW**
`_STRINGCONSTANT: /"([^"\\]|\\.)*"/` (`grammar.js:736`). JS `.` does not match
newlines, but the NED lexer explicitly supports `\<newline>` line continuation
inside strings (`ned2.lex:136`). Multi-line string literals fail.

Fix: allow `\\(.|\r?\n)` in the escape branch.

---

## 2. Expression precedence and associativity are not modeled  — **HIGH (for semantic tools)**

Every binary and unary operator in `_expression` is wrapped in a single
`prec.right(10, choice(...))` (`grammar.js:542–586`). This means the parse tree
does **not** reflect NED's operator precedence/associativity, which is fully
specified in `ned2.y:51–69`:
```
%right '?' ':'      %left OR  XOR  AND  EQ NE   '<' '>' LE GE   SPACESHIP
%left MATCH '|' '#' '&'   SHIFT_LEFT SHIFT_RIGHT   '+' '-'   '*' '/' '%'
%right '^'   %right UMIN_ NEG_ NOT_   %left '.'
```
Effects:
- `a + b * c` parses as a flat / right-leaning tree instead of `a + (b * c)`.
- `a - b - c` is treated right-associative instead of left.
- Any tool that evaluates, refactors, or even semantically highlights
  expressions gets the wrong structure.

For pure token coloring this is tolerable; for everything else it is a
significant limitation. Recommendation: introduce named precedence levels with
`prec.left` / `prec.right` mirroring the table above (this is the standard
tree-sitter idiom and removes the need for the catch-all `prec.right(10)`).

---

## 3. Tooling ergonomics: expose structure via `field()`  — **MEDIUM/HIGH**

Only two fields are declared in the whole grammar (`parameter_signature`,
`property_signature`; `grammar.js` + `src/node-types.json`). Most structural
data is reachable only through `alias()`d anonymous-position nodes, which makes
queries brittle (position-dependent) and node-types.json uninformative for tool
authors.

Add fields for the elements tools navigate by, e.g.:
- module/channel/network/interface: `name`, `extends`, `like`/`implements`.
- `submodule`: `name`, `type`, `like_type`, `like_expr`, `vector`/`size`,
  `condition`.
- `connection`: `src`, `dest`, `arrow`, `channel`, `condition`, loop bounds.
- `parameter`: `type`, `name`, `value`, `is_volatile`, `is_default`.
- `gate`: `direction`, `name`, `vector`.
- `loop`: `param_name`, `from_value`, `to_value`.

This is the single highest-leverage change for "tools can use this better."

---

## 4. Code-navigation queries are missing  — **MEDIUM**

`queries/` contains only a sparse `highlights.scm`. To let editors and tools do
real work, add the standard tree-sitter query files:
- **`tags.scm`** — symbol definitions/references (modules, channels, networks,
  interfaces, submodules, parameters, gates). Enables go-to-definition, symbol
  outline, and GitHub/`stack-graphs`-style navigation. This is what most
  "tools" actually consume.
- **`locals.scm`** — scopes for `for`-loop variables, submodule names, gate
  names; enables correct rename and reference highlighting.
- **`injections.scm`** — inject `xml` into `xmldoc("…")` / xml string params,
  and (optionally) treat `@signal`/`@statistic` property values specially.
- **`indents.scm`** / `folds.scm` — block-aware indentation and folding for the
  `{ … }` sections.

The existing `highlights.scm` should also be expanded (it currently colors only
a handful of keywords): cover `import`/`export` names, the type keywords
(`double int string bool object xml`), gate directions
(`input output inout`), operators, numeric/string/bool literals, `@property`
names, and the `volatile`/`default`/`ask`/`this`/`parent`/`index`/`typename`/
`sizeof`/`exists`/`xmldoc` words.

---

## 5. Lexer-fidelity and robustness gaps  — **LOW**

- **`const` reserved word**: NED lexes `const` as a keyword (`ned2.lex:120`,
  token `CONST_`). The grammar treats it as a plain `NAME`. (The token is unused
  in `ned2.y`, so impact is small, but a `const`-named identifier would behave
  differently than the reference parser.)
- **UTF-8 BOM**: the reference lexer skips a leading BOM (`ned2.lex:230`). The
  tree-sitter grammar does not; a BOM-prefixed file may fail on the first token.
- **Property-value capture** uses `_COMMONCHAR: /[^"]/` one char at a time
  (`grammar.js:739,310–320`). The reference lexer has a dedicated
  `propertyvalue` state with paren/brace depth tracking (`ned2.lex:174–183`).
  The current approach is fragile around nested parens, embedded strings, and
  `;`/`,`/`=` that are significant only at depth 1; consider tightening it.
- **Property index character class**: `_PROPINDEX`
  (`grammar.js:733`) requires a leading letter/underscore, but the reference
  allows a leading `*`/`?`/digit (`ned2.lex:169`: `({L}|{D}|[*?{}:.-])+`), e.g.
  `@foo[*]` style indices.
- **Single vs. double quoted strings**: the reference treats both `"…"` and
  `'…'` uniformly as `STRINGCONSTANT` (`ned2.lex:133,143`). The grammar splits
  them ad hoc between `_STRINGCONSTANT` and `_XMLCONSTANT`; unifying would
  simplify and match semantics. (`CHARCONSTANT` is declared but unused in the
  reference — no action needed.)

---

## 6. Comment / blank-line handling is fragile  — **LOW**

`inline_comment` is in `extras` (can appear anywhere), while the grouped
`comment` node (`grammar.js:30`) is only listed explicitly in a few contexts
(file top-level, params, gates, submodules, connections). `_EMPTYLINE`
(`grammar.js:738`) is also threaded into the top-level choice as if it were a
token. This dual scheme:
- can drop/misattach `comment` nodes that appear in other positions (e.g. inside
  a `types:` block, or between a submodule's braces), risking parse errors where
  the reference parser (which discards `//` comments entirely and re-attaches
  them by source position) would succeed;
- duplicates concerns between `comment`, `inline_comment`, and `_EMPTYLINE`.

The grammar's choice to surface comments as nodes is *good* for tooling (the
reference parser throws them away); the recommendation is just to make it
uniform — rely on `extras` for comments everywhere and drop the special-cased
`comment`/`_EMPTYLINE` placements, or document the intended attachment model.

---

## 7. Test-coverage gaps

The corpus (17 cases) covers real files well but misses the edge cases that hide
the bugs above. Add focused cases for:
- `##` (XOR) and `=~` (match) operators.
- hex integers (`0xFF`), exponent reals (`2.5e8`, `1e+10`, `1.5e-3`),
  exponent quantities (`1.5e-3s`).
- bare `index` and `typename` as parameter values.
- operator-precedence trees (`a + b * c`, `a ? b : c ? d : e`,
  `-2 ^ 2`, chained `&&`/`||`/`##`).
- empty file, comment-only file.
- multi-line (`\`-continued) string literals.
- `this.`/`parent.` qualified names, `sizeof(...)`, `exists(...)`.
- channel `like` connections and `allowunconnected`.

---

## Suggested priority

1. **Operator fixes** `^^`→`##`, `match`→`=~` (1.1, 1.2) — one-line, high impact.
2. **Number lexer** hex + real exponents (1.3, 1.4).
3. **Bare `index`/`typename`** and **empty file** (1.5, 1.6).
4. **Expression precedence** (section 2) — large but enables semantic tooling.
5. **`field()` coverage** (section 3) and **`tags.scm`/`locals.scm`**
   (section 4) — the changes that most directly let tools "use this better."
6. Remaining lexer-fidelity, comment-model, and over-acceptance cleanups
   (1.7–1.9, sections 5–6), backed by new corpus tests (section 7).
</content>
</invoke>
