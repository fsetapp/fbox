// Constant value will not change forever.
import { v4 as uuid } from "uuid"
import { s } from "./registry.js"

export const PKG_NAME = "core"
const MODULE = s({ PKG_NAME }).t

export const TOPLV_TAG = "top"
export const BLANK = 255
export const REF = 28
export const LITERAL = 254

const toStr = { [REF]: "ref", [LITERAL]: "literal", [BLANK]: "" }

export const ref = (anchor, opts) => Object.assign({ m: MODULE, t: REF, $r: anchor }, opts)
export const blank = () => ({ m: MODULE, t: BLANK })

export const putAnchor = (sch, opts = {}) => {
  let newSch = sch()

  newSch.$a ||= uuid()
  if (opts.force) newSch.$a = uuid()

  return newSch
}

export const containsRefTo = (schList, top) =>
  schList.find(sch_ => {
    const isRef = sch_.m == MODULE && sch_.t == REF

    if (isRef)
      if (!sch_.to) return true
      else return isRefToOK(sch_, top)
  })

const isRefToOK = (sch, top) =>
  sch.to.find(a => {
    let isSameT = a.t == top.sch.t
    top.sch.metadata ||= {}

    // optional query condition based on "metadata prop k"
    if (a.metadata) {
      let isMatched = true
      for (let k of Object.keys(a.metadata))
        if (typeof a.metadata[k] == "boolean")
          isMatched = isMatched && a.metadata[k] == !!top.sch.metadata[k]

      return isSameT && isMatched
    }
    else
      return isSameT
  })

const sheet = {}

export const structSheet = { sheet, toStr }
