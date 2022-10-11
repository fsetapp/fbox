import { putAnchor } from "./core.js"
import * as Actions from "../actions.js"
import { string } from "./model.js"
import { s } from "./registry.js"

export const PKG_NAME = "html"
export const MODULE = s({ PKG_NAME }).t

// Note: There are two aspects of validity
// 1. structural valid
// 2. spec valid
// If we make "tag" a symbol here, it's treat as structural validation.
// Maybe we would have a separate util in compiler to validate spec (such as <head> can only contain a few tags),
// This way we would only have `tag`, `attr` like Elm html.
// https://developer.mozilla.org/en-US/docs/Web/HTML/Element

const HTML = 0
export const TAG = 1
const ATTR = 2
export const TEXT = 3 // 0xBF

const toStr = {
  [HTML]: "children",
  [TAG]: "tag",
  [ATTR]: "attr",
}

const ctor = (ctor_, opts) => Object.assign(ctor_, { m: MODULE }, opts)

const html = opts => ctor({ t: HTML, fields: [] }, opts)
const tag = opts => ctor({ t: TAG, schs: [putAnchor(attrs), putAnchor(html)] }, opts)
const attrs = opts => ctor({ t: ATTR, fields: [] }, opts)
const str = opts => ctor(string(), opts)
export const text = opts => ctor({ t: TEXT, v: "" }, opts)

const toVal = ({ v }, strval) => {
  if (v == undefined) return
  return { m: MODULE, t: TEXT, v: strval }
}

export const tops = { anyOf: [html()] }

// Sheet structural rules is like type signature where children is mostly union type.
const sheet = {
  [HTML]: {
    children: {
      anyOf: [tag()]
    }
  },
  [TAG]: {
    nthChild: {
      0: { anyOf: [attrs()] },
      1: { anyOf: [html()] }
    }
  },
  [ATTR]: {
    children: { anyOf: [str()] }
  }
}

export const structSheet = { sheet, tops, toStr, toVal }
