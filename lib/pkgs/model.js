import * as Core from "./core.js"
import * as Actions from "../actions.js"
import { s } from "./registry.js"

export const PKG_NAME = "model"
const MODULE = s({ PKG_NAME }).t

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
export const _INTEGER_ = [INT8, INT16, INT32, UINT8, UINT16, UINT32]
export const FLOAT32 = 24
export const FLOAT64 = 25
export const NUMBER = [FLOAT32, FLOAT64]
export const BOOLEAN = 26
export const NULL = 27
export const VALUE = 29
export const ANY = 30
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
  [INTEGER]: "integer",
  [INT8]: "int8",
  [UINT8]: "uint8",
  [INT16]: "int16",
  [UINT16]: "uint16",
  [INT32]: "int32",
  [UINT32]: "uint32",

  [FLOAT32]: "float32",
  [FLOAT64]: "float64",

  [BOOLEAN]: "boolean",
  [NULL]: "nil",
  [VALUE]: "value",
  [ANY]: "any",
}

export const attrs = {
  [INT8]: { min: -128, max: 127 },
  [INT16]: { min: -32768, max: 32767 },
  [INT32]: { min: -2147483648, max: 2147483647 },
  [UINT8]: { min: 0, max: 255 },
  [UINT16]: { min: 0, max: 65535 },
  [UINT32]: { min: 0, max: 4294967295 }
}

export const any = (opts) => ctor({ t: ANY }, opts)
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
export const nil = (opts) => ctor({ t: NULL }, opts)
export const record = (opts) => ctor({ t: RECORD, fields: [] }, opts)
export const erecord = (opts) => ctor({ t: E_RECORD, schs: [putAnchor(() => ref(null)), putAnchor(record)] }, opts)
export const list = (opts) => ctor({ t: LIST, sch: putAnchor(any) }, opts)
export const tuple = (opts) => ctor({ t: TUPLE, schs: [putAnchor(any)] }, opts)
export const union = (opts) => ctor({ t: UNION, schs: [putAnchor(any)] }, opts)
export const taggedUnion = (opts) => ctor({ t: TAGGED_UNION, fields: [{ ...putAnchor(record), key: "tag_a" }], tagname: "tag", allowedSchs: [record()], tag: "tag" }, opts)
export const dict = (opts) => ctor({ t: DICT, schs: [putAnchor(string), putAnchor(any)] }, opts)
export const value = (strval) => {
  try {
    const val = JSON.parse(strval)

    if (val == null)
      return nil()
    else if (["number", "string", "boolean"].includes(typeof val))
      return { m: MODULE, t: VALUE, v: val }
    else
      return
  }
  catch (e) { return }
}
const toVal = ({ v }, strval) => {
  if (v == undefined) return
  return value(strval)
}

export const all = [
  string, record, list, tuple, union, any, bool, nil,
  integer, int8, int16, int32, uint8, uint16, uint32, float32, float64,
  taggedUnion, dict, erecord, () => value("\"json string\""), () => ref(null)
]

export const tops = all.map(sch => ({ ...sch(), tag: Core.TOPLV_TAG }))

const sheet = {
  [DICT]: {
    self: {
      exceptActions: [Actions.addSch, Actions.paste]
    },
    children: {
      exceptActions: [Actions.cut, Actions.copy, Actions.cloneUp, Actions.cloneDown, Actions.deleteSelected, Actions.reorderUp, Actions.reorderDown]
    },
    nthChild: [
      {
        allowedSchs: [string()]
      }
    ]
  },
  [E_RECORD]: {
    self: {
      exceptActions: [Actions.addSch, Actions.paste]
    },
    children: {
      exceptActions: [Actions.cut, Actions.copy, Actions.cloneUp, Actions.cloneDown, Actions.deleteSelected, Actions.reorderUp, Actions.reorderDown]
    },
    nthChild: [
      { allowedSchs: [ref(null, { to: [record({ metadata: { strict: false } })] })] },
      { allowedSchs: [record()], exceptActions: [Actions.activateEditType, Actions.submitEdit] }
    ]
  },
  [TAGGED_UNION]: {
    children: {
      allowedSchs: [record(), ref(null, { to: [record()] })],
      min: 1
    }
  },
  [TUPLE]: {
    children: {
      allowedSchs: all.map(a => a()),
      min: 1
    }
  },
  [UNION]: {
    children: {
      allowedSchs: all.map(a => a()),
      min: 1
    }
  },
  ["default"]: {
    children: {
      allowedSchs: all.map(a => a()),
      defaultSch: 1
    }
  }
}

export const structSheet = { sheet, toStr, toVal, attrs }
