import { v4 as uuid } from "uuid"

// Expect 2^8 = 0-255 code range.
// preserve 0-7 = 2^3

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
export const INTEGER = [INT8, INT16, INT32, UINT8, UINT16, UINT32]
export const FLOAT32 = 24
export const FLOAT64 = 25
export const NUMBER = [FLOAT32, FLOAT64]
export const BOOLEAN = 26
export const NULL = 27
export const REF = 28
export const VALUE = 29
export const ANY = 30
export const TIMESTAMP = 31

export const FMODEL_TAG = "fmodel"

export const any = () => ({ t: ANY })
export const string = () => ({ t: STRING })
export const bool = () => ({ t: BOOLEAN })
export const int8 = () => ({ t: INT8 })
export const int16 = () => ({ t: INT16 })
export const int32 = () => ({ t: INT32 })
export const uint8 = () => ({ t: UINT8 })
export const uint16 = () => ({ t: UINT16 })
export const uint32 = () => ({ t: UINT32 })
export const float32 = () => ({ t: FLOAT32 })
export const float64 = () => ({ t: FLOAT64 })
export const timestamp = () => ({ t: TIMESTAMP })
export const nil = () => ({ t: NULL })
export const record = () => ({ t: RECORD, fields: [] })
export const erecord = () => ({ t: E_RECORD, schs: [putAnchor(() => ref(null)), putAnchor(record)] })
export const list = () => ({ t: LIST, sch: putAnchor(any) })
export const tuple = () => ({ t: TUPLE, schs: [putAnchor(any)] })
export const union = () => ({ t: UNION, schs: [putAnchor(any)] })
export const taggedUnion = () => ({ t: TAGGED_UNION, fields: [{ ...putAnchor(record), key: "tag_a" }], tagname: "tag", allowedSchs: [record()], keyPrefix: "tag" })
export const dict = () => ({ t: DICT, schs: [putAnchor(string), putAnchor(any)] })
export const ref = (anchor, opts) => Object.assign({ t: REF, $r: anchor }, opts)
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

export const putAnchor = (sch, opts = {}) => {
  let newSch = sch()

  newSch.$a ||= uuid()
  if (opts.force) newSch.$a = uuid()

  return newSch
}

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
  [REF]: "ref",
  [VALUE]: "value",
  [ANY]: "any",
  [TIMESTAMP]: "timestamp"
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
