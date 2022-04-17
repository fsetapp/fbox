// Constant value will not change forever.
import { v4 as uuid } from "uuid"

export const PKG_NAME = "core"

export const TOPLV_TAG = "top_lv"
export const BLANK = 255
export const REF = 28
export const LITERAL = 254

export const toStr = t => tstr[t]
const tstr = { [REF]: "ref", [LITERAL]: "literal" }

export const ref = (anchor, opts) => Object.assign({ t: REF, $r: anchor }, opts)
export const blank = () => ({ t: BLANK })
// Same as Model.value function since we don't have fancy data type currently
export const value = (v) => {
  try {
    v = JSON.parse(v)
    if (
      (v == null) ||
      (["string", "number", "boolean"].includes(typeof v))
    ) return { t: LITERAL, v: v }
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

export { }
