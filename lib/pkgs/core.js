// Constant value will not change forever.
import { v4 as uuid } from "uuid"
import { s } from "./registry.js"

export const PKG_NAME = "core"
const MODULE = s({ PKG_NAME }).t

export const TOPLV_TAG = "top_lv"
export const BLANK = 255
export const REF = 28
export const LITERAL = 254

const toStr = t => tstr[t]
const tstr = { [REF]: "ref", [LITERAL]: "literal" }

// const CoreRef = [s(Core).t, Core.ref(null).t]
// const ref = args => assign(Core.ref(args), { t: CoreRef })

export const ref = (anchor, opts) => Object.assign({ m: MODULE, t: REF, $r: anchor }, opts)
export const blank = () => ({ m: MODULE, t: BLANK })
// Same as Model.value function since we don't have fancy data type currently
export const value = (v) => {
  try {
    v = JSON.parse(v)
    if (
      (v == null) ||
      (["string", "number", "boolean"].includes(typeof v))
    ) return { m: MODULE, t: LITERAL, v: v }
    else
      return false
  }
  catch (e) {
    return false
  }
}
export const putAnchor = (sch, opts = {}) => {
  let newSch = sch()

  newSch.$a ||= uuid()
  if (opts.force) newSch.$a = uuid()

  return newSch
}

export const legitTs = (tList, model) =>
  tList.find(sch_ => {
    const isRef = sch_.t == ref(null).t

    if (isRef)
      if (!sch_.to) return true
      else return legitRefTo(sch_, model)
  })

const legitRefTo = (sch, model) =>
  sch.to.find(a => {
    let isSameT = a.t == model.sch.t
    model.sch.metadata ||= {}

    if (a.metadata) {
      let matchQ = true
      for (let k of Object.keys(a.metadata))
        if (typeof a.metadata[k] == "boolean")
          matchQ = matchQ && a.metadata[k] == !!model.sch.metadata[k]

      return isSameT && matchQ
    }
    else
      return isSameT
  })

const sheet = t => null

export const structSheet = { sheet, toStr }
