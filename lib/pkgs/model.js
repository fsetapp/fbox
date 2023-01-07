import * as Core from "./core.js"
import * as Actions from "../actions.js"
import { s } from "./registry.js"
import source from "./model/sss.json"
import { deepMerge, map, forEach } from "../utils.js"

export const PKG_NAME = "model"
export const MODULE = s({ PKG_NAME }).t
const ctor = (ctor_, opts) => Object.assign(JSON.parse(JSON.stringify(ctor_)), { m: MODULE }, opts)

const K = {}
const C = {}
const any = []
const toStr = {}
const sheet = {}
for (let k of Object.keys(source)) {
  let { sheet: rules, ...sch } = source[k]
  if (!sch.t) continue

  // Const and Ctor
  K[k.toUpperCase()] = sch.t
  C[k] = (opts) => ctor(sch, opts)
  any.push(ctor(sch))

  toStr[sch.t] = k
  if (rules) sheet[sch.t] = rules
}

const { putAnchor, ref } = Core
const importedSSS = { "core": { "ref": Core.ref } }

Object.assign(toStr, {
  [K.INTEGER]: "int",
  [K.NUMBER]: "num",
  [K.INT8]: "i8",
  [K.UINT8]: "u8",
  [K.INT16]: "i16",
  [K.UINT16]: "u16",
  [K.INT32]: "i32",
  [K.UINT32]: "u32",

  [K.FLOAT32]: "f32",
  [K.FLOAT64]: "f64",
})

const attrs = {
  [K.INT8]: { min: -128, max: 127 },
  [K.INT16]: { min: -32768, max: 32767 },
  [K.INT32]: { min: -2147483648, max: 2147483647 },
  [K.UINT8]: { min: 0, max: 255 },
  [K.UINT16]: { min: 0, max: 65535 },
  [K.UINT32]: { min: 0, max: 4294967295 }
}

// export const nil = (opts) => ctor({ t: NIL, v: null }, opts)
// export const record = (opts) => ctor({ t: RECORD, fields: [] }, opts)
// export const erecord = (opts) => ctor({ t: E_RECORD, schs: [putAnchor(() => ref(null)), putAnchor(record)] }, opts)
// export const list = (opts) => ctor({ t: LIST, sch: putAnchor(string) }, opts)
// export const tuple = (opts) => ctor({ t: TUPLE, schs: [putAnchor(string)] }, opts)
// export const union = (opts) => ctor({ t: UNION, schs: [putAnchor(string)] }, opts)
// export const taggedUnion = (opts) => ctor({ t: TAGGED_UNION, fields: [{ ...putAnchor(record), key: "tag_a" }], tagname: "tag" }, opts)
// export const dict = (opts) => ctor({ t: DICT, schs: [putAnchor(string), putAnchor(string)] }, opts)

const toVal = ({ t, v }, strval) => {
  const typeofT = { [K.FLOAT64]: "number", [K.STRING]: "string", [K.BOOL]: "boolean" }
  const Tfromtype = { boolean: K.BOOL, number: K.NUMBER, string: K.STRING }

  let val
  try { val = JSON.parse(strval) }
  catch (e) { val = strval }

  if (val == null)
    return nil()
  else if (Number.isInteger(val))
    return { m: MODULE, t: K.INTEGER, v: val }
  else if (typeof val == typeofT[t])
    return { m: MODULE, t: t, v: val }
  else if (Tfromtype[typeof val]) {
    // cast .t as val type
    return { m: MODULE, t: Tfromtype[typeof val], v: val }
  }
}

const tops = { of: any, defaultSch: C.string() }
const fillActs = [Actions.addSch, Actions.paste]
const mutateActs = [Actions.cut, Actions.copy, Actions.cloneUp, Actions.cloneDown, Actions.deleteSelected, Actions.reorderUp, Actions.reorderDown]
deepMerge(sheet, {
  [K.DICT]: {
    self: { off: fillActs },
    children: { off: mutateActs },
  },
  [K.E_RECORD]: {
    self: { off: fillActs },
    children: { off: mutateActs },
    child: {
      1: { off: [Actions.activateEditType, Actions.submitEdit] }
    }
  },
  ["default"]: { children: { defaultSch: "string" } }
})

for (let t of Object.values(sheet)) {
  const toCtor = a => {
    let ret
    if (typeof a == "string") ret = C[a]()
    else if (typeof a.t == "string") {
      const { t, m, ...a_ } = a
      // resolve t: "name" to t: id. Internal || external lookup
      if (C[t]) ret = Object.assign(C[t](), a_)
      else {
        if (a_.to) a_.to = a.to.map(a => toCtor(a))
        ret = Object.assign(importedSSS[m][t](), a_)
      }
    }

    if (!ret) throw { msg: "Unable to resolve value", value: a }
    else return ret
  }

  forEach(Object.values(t.child || []), c => {
    if (c.of) c.of = map(c.of, a => toCtor(a))
    else c.of = any
    return c
  })
  if (t.children.defaultSch) t.children.defaultSch = toCtor(t.children.defaultSch)
  if (t.children.of) t.children.of = map(t.children.of, c => toCtor(c))
  else t.children.of = any
}

export { K, C, toStr, toVal, attrs, tops, sheet }
