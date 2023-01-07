import { ref } from "./core.js"
import * as M from "./model.js"
import { s } from "./registry.js"

const { string, number, bool } = M.C

export const PKG_NAME = "html"
export const MODULE = s({ PKG_NAME }).t

// Note: There are two aspects of validity
// 1. structural valid
// 2. spec valid
// If we make "tag" a symbol here, it's treat as structural validation.
// Maybe we would have a separate util in compiler to validate spec (such as <head> can only contain a few tags),
// This way we would only have `tag`, `attr` like Elm html.
// https://developer.mozilla.org/en-US/docs/Web/HTML/Element

export const HTML = 0
export const TAG = 1
export const ATTR = 2
export const TEXT = 3 // 0xBF
export const EXPR = 4

const toStr = {
  [HTML]: "html",
  [TAG]: "tag",
  [ATTR]: "attr",
  [TEXT]: "text",
  [EXPR]: "expr",
  [string().t]: "str"
}

const ctor = (ctor_, opts) => Object.assign(ctor_, { m: MODULE }, opts)

const html = opts => ctor({ t: HTML, fields: [] }, opts)
const tag = opts => ctor({ t: TAG, fields: [] }, opts)
const attrs = opts => ctor({ t: ATTR, fields: [] }, opts)
export const text = opts => ctor({ t: TEXT, v: "" }, opts)
// logic-less template (liquid-like, only support some primitives and object)
// For example, {{ 4 | plus: 2 }} sch: pipe[4,+2] where pipe: {t: pipe, schs: }
const expr = opts => ctor({ t: EXPR, sch: string({ v: "" }) }, opts)

const toVal = (a, strval) => {
  // Just hold a as expresion and be able to display, not needs to evaluate
  if (a.t == EXPR) a.sch = M.toVal(a.sch, strval)
  else if (a.t == TEXT) a.v = strval
  return a
}
export const tops = { of: [html()] }


// Sheet structural rules is like type signature where children is mostly union type.
// thinking in abstract, it looks like [function]: {children: [param, param]}.
const sheet = {
  [HTML]: {
    children: {
      of: [tag({ key: "span" })],
      kDup: true
    }
  },
  [TAG]: {
    child: {
      0: { of: [attrs({ key: "attr" })] },
    },
    children: {
      put: { pos: "append" },
      of: [tag({ key: "span" }), ref(null, { to: [html()] }), text({ v: "" })],
      kDup: true
    }
  },
  [ATTR]: {
    children: { of: [expr()] }
  },
  [EXPR]: {
    children: { of: [string, number, bool].map(a => a({ v: "" })) }
  }
}

export const structSheet = { sheet, tops, toStr, toVal }
