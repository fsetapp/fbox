import * as Core from "./core.js"
import * as Actions from "../actions.js"
import { s } from "./registry.js"

export const PKG_NAME = "model"

const { putAnchor } = Core
const { assign } = Object

const CoreRef = [s(Core).t, Core.ref(null).t]
const ref = args => assign(Core.ref(args), { t: CoreRef })

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

export const toStr = t => tstr[t]
const tstr = {
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

export const attrs = t => tattrs[t]
const tattrs = {
  [INT8]: { min: -128, max: 127 },
  [INT16]: { min: -32768, max: 32767 },
  [INT32]: { min: -2147483648, max: 2147483647 },
  [UINT8]: { min: 0, max: 255 },
  [UINT16]: { min: 0, max: 65535 },
  [UINT32]: { min: 0, max: 4294967295 }
}

export const any = () => ({ t: ANY })
export const string = () => ({ t: STRING })
export const bool = () => ({ t: BOOLEAN })
// export const bool = () => ({ t: BOOLEAN, fn: [args can't be emply] })
export const integer = () => ({ t: INTEGER })
export const int8 = () => ({ t: INT8 })
export const int16 = () => ({ t: INT16 })
export const int32 = () => ({ t: INT32 })
export const uint8 = () => ({ t: UINT8 })
export const uint16 = () => ({ t: UINT16 })
export const uint32 = () => ({ t: UINT32 })
export const float32 = () => ({ t: FLOAT32 })
export const float64 = () => ({ t: FLOAT64 })
export const nil = () => ({ t: NULL })
export const record = (opts) => assign(({ t: RECORD, fields: [] }), opts)
export const erecord = (opts) => assign(({ t: E_RECORD, schs: [putAnchor(() => ref(null)), putAnchor(record)] }), opts)
export const list = () => ({ t: LIST, sch: putAnchor(any) })
export const tuple = () => ({ t: TUPLE, schs: [putAnchor(any)] })
export const union = () => ({ t: UNION, schs: [putAnchor(any)] })
export const taggedUnion = () => ({ t: TAGGED_UNION, fields: [{ ...putAnchor(record), key: "tag_a" }], tagname: "tag", allowedSchs: [record()], tag: "tag" })
export const dict = () => ({ t: DICT, schs: [putAnchor(string), putAnchor(any)] })
export const value = (v) => {
  try {
    v = JSON.parse(v)
    if (
      (v == null) ||
      (["string", "number", "boolean"].includes(typeof v))
    ) return { t: VALUE, v: v }
    else
      return false
  }
  catch (e) {
    return false
  }
}

export const all = [
  string, record, list, tuple, union, any, bool, nil,
  integer, int8, int16, int32, uint8, uint16, uint32, float32, float64,
  taggedUnion, dict, erecord, () => value("\"json string\""), () => ref(null)
]

export const tops = all.map(sch => ({ ...sch(), tag: Core.TOPLV_TAG }))

const sheet = [
  {
    selector: [["t", DICT]],
    rules: {
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
    }
  },
  {
    selector: [["t", E_RECORD]],
    rules: {
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
    }
  },
  {
    selector: [["t", TAGGED_UNION]],
    rules: {
      children: {
        min: 1,
        allowedSchs: [record(), ref(null, { to: [record()] })]
      }
    }
  },
  {
    selector: true,
    rules: {
      children: {
        allowedSchs: all.map(a => a()),
        defaultSch: 1
      }
    }
  }
]

export const structSheet = { sheet, toStr, attrs }
