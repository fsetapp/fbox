import * as Core from "./core.js"
import * as Actions from "../actions.js"
import { s } from "./registry.js"

export const PKG_NAME = "model"
export const MODULE = s({ PKG_NAME }).t

const { putAnchor, ref } = Core
const ctor = (ctor_, opts) => Object.assign(ctor_, { m: MODULE }, opts)

export const RECORD = 10
export const E_RECORD = 11
export const DICT = 12
export const LIST = 13
export const TUPLE = 14
export const UNION = 15
export const TAGGED_UNION = 16

export const STRING = 17
export const INT8 = 18
export const UINT8 = 19
export const INT16 = 20
export const UINT16 = 21
export const INT32 = 22
export const UINT32 = 23
export const FLOAT32 = 24
export const FLOAT64 = 25

export const BOOLEAN = 26
export const NULL = 27
export const INTEGER = 31

export const toStr = {
  [RECORD]: "record",
  [E_RECORD]: "e_record",
  [DICT]: "dict",
  [LIST]: "list",
  [TUPLE]: "tuple",
  [UNION]: "union",
  [TAGGED_UNION]: "tagged_union",

  [STRING]: "string",
  [INTEGER]: "int",
  [INT8]: "i8",
  [UINT8]: "u8",
  [INT16]: "i16",
  [UINT16]: "u16",
  [INT32]: "i32",
  [UINT32]: "u32",

  [FLOAT32]: "f32",
  [FLOAT64]: "f64",

  [NULL]: "null",
  [BOOLEAN]: "bool",
}

export const attrs = {
  [INT8]: { min: -128, max: 127 },
  [INT16]: { min: -32768, max: 32767 },
  [INT32]: { min: -2147483648, max: 2147483647 },
  [UINT8]: { min: 0, max: 255 },
  [UINT16]: { min: 0, max: 65535 },
  [UINT32]: { min: 0, max: 4294967295 }
}

export const string = (opts) => ctor({ t: STRING }, opts)
export const bool = (opts) => ctor({ t: BOOLEAN }, opts)
// export const bool = (opts) => ctor({ t: BOOLEAN, fn: [args can't be emply] }, opts)
export const integer = (opts) => ctor({ t: INTEGER }, opts)
export const int8 = (opts) => ctor({ t: INT8 }, opts)
export const int16 = (opts) => ctor({ t: INT16 }, opts)
export const int32 = (opts) => ctor({ t: INT32 }, opts)
export const uint8 = (opts) => ctor({ t: UINT8 }, opts)
export const uint16 = (opts) => ctor({ t: UINT16 }, opts)
export const uint32 = (opts) => ctor({ t: UINT32 }, opts)
export const float32 = (opts) => ctor({ t: FLOAT32 }, opts)
export const float64 = (opts) => ctor({ t: FLOAT64 }, opts)
export const nil = (opts) => ctor({ t: NULL, v: null }, opts)
export const record = (opts) => ctor({ t: RECORD, fields: [] }, opts)
export const erecord = (opts) => ctor({ t: E_RECORD, schs: [putAnchor(() => ref(null)), putAnchor(record)] }, opts)
export const list = (opts) => ctor({ t: LIST, sch: putAnchor(string) }, opts)
export const tuple = (opts) => ctor({ t: TUPLE, schs: [putAnchor(string)] }, opts)
export const union = (opts) => ctor({ t: UNION, schs: [putAnchor(string)] }, opts)
export const taggedUnion = (opts) => ctor({ t: TAGGED_UNION, fields: [{ ...putAnchor(record), key: "tag_a" }], tagname: "tag" }, opts)
export const dict = (opts) => ctor({ t: DICT, schs: [putAnchor(string), putAnchor(string)] }, opts)

const toVal = ({ t, v }, strval) => {
  const typeofT = { [FLOAT64]: "number", [STRING]: "string", [BOOLEAN]: "boolean" }
  let val
  try { val = JSON.parse(strval) }
  catch (e) { val = strval }

  if (val == null)
    return nil()
  else if (Number.isInteger(val))
    return { m: MODULE, t: INTEGER, v: val }
  else if (typeof val == typeofT[t])
    return { m: MODULE, t: t, v: val }
  else
    return
}

export const all = [
  string, record, list, tuple, union, bool, nil,
  integer, int8, int16, int32, uint8, uint16, uint32, float32, float64,
  taggedUnion, dict, erecord, () => string({ v: "json string" }), () => ref(null)
]

const tops = {
  anyOf: all.map(sch => ({ ...sch(), tag: Core.TOPLV_TAG })),
  defaultSch: 1
}

const sheet = {
  [DICT]: {
    self: {
      off: [Actions.addSch, Actions.paste]
    },
    children: {
      off: [Actions.cut, Actions.copy, Actions.cloneUp, Actions.cloneDown, Actions.deleteSelected, Actions.reorderUp, Actions.reorderDown]
    },
    nthChild: {
      0: { anyOf: [string()] },
      1: { anyOf: all.map(a => a()) }
    }
  },
  [E_RECORD]: {
    self: {
      off: [Actions.addSch, Actions.paste]
    },
    children: {
      off: [Actions.cut, Actions.copy, Actions.cloneUp, Actions.cloneDown, Actions.deleteSelected, Actions.reorderUp, Actions.reorderDown]
    },
    nthChild: {
      0: { anyOf: [ref(null, { to: [record({ metadata: { strict: false } })] })] },
      1: { anyOf: [record()], off: [Actions.activateEditType, Actions.submitEdit] }
    }
  },
  [TAGGED_UNION]: {
    children: {
      anyOf: [record(), ref(null, { to: [record()] })],
      min: 1
    }
  },
  [TUPLE]: {
    children: {
      anyOf: all.map(a => a()),
      min: 1
    }
  },
  [UNION]: {
    children: {
      anyOf: all.map(a => a()),
      min: 1
    }
  },
  ["default"]: {
    children: {
      anyOf: all.map(a => a()),
      defaultSch: 1
    }
  }
}

export const structSheet = { tops, sheet, toStr, toVal, attrs }
