import { v4 as uuid } from "uuid"
import * as Actions from "../actions.js"

export const RECORD = "record"
export const E_RECORD = "erecord"
export const DICT = "dict"
export const LIST = "list"
export const TUPLE = "tuple"
export const UNION = "union"
export const TAGGED_UNION = "tunion"
export const STRING = "string"
export const INT8 = "int8"
export const UINT8 = "uint8"
export const INT16 = "int16"
export const UINT16 = "uint16"
export const INT32 = "int32"
export const UINT32 = "uint32"
export const INTEGER = [INT8, INT16, INT32, UINT8, UINT16, UINT32]
export const FLOAT32 = "float32"
export const FLOAT64 = "float64"
export const NUMBER = [FLOAT32, FLOAT64]
export const TIMESTAMP = "timestamp"
export const BOOLEAN = "boolean"
export const NULL = "null"
export const ANY = "any"
export const REF = "ref"
export const VALUE = "value"

export const FMODEL_TAG = "fmodel"

export const any = () => ({ type: ANY })
export const string = () => ({ type: STRING })
export const bool = () => ({ type: BOOLEAN })
export const int8 = () => ({ type: INT8, min: -128, max: 127 })
export const int16 = () => ({ type: INT16, min: -32768, max: 32767 })
export const int32 = () => ({ type: INT32, min: -2147483648, max: 2147483647 })
export const uint8 = () => ({ type: UINT8, min: 0, max: 255 })
export const uint16 = () => ({ type: UINT16, min: 0, max: 65535 })
export const uint32 = () => ({ type: UINT32, min: 0, max: 4294967295 })
export const float32 = () => ({ type: FLOAT32 })
export const float64 = () => ({ type: FLOAT64 })
export const timestamp = () => ({ type: TIMESTAMP })
export const nil = () => ({ type: NULL })
export const record = () => ({ type: RECORD, fields: [] })
export const erecord = () => ({ type: E_RECORD, schs: [putAnchor(() => ref(null)), putAnchor(record)] })
export const list = () => ({ type: LIST, sch: putAnchor(any) })
export const tuple = () => ({ type: TUPLE, schs: [putAnchor(any)] })
export const union = () => ({ type: UNION, schs: [putAnchor(any)] })
export const taggedUnion = () => ({ type: TAGGED_UNION, fields: [{ ...putAnchor(record), key: "tag_a" }], tagname: "tag", allowedSchs: [record()], keyPrefix: "tag" })
export const dict = () => ({ type: DICT, schs: [putAnchor(string), putAnchor(any)] })
export const ref = (anchor) => ({ type: REF, $ref: anchor })
export const value = (v) => {
  try {
    v = JSON.parse(v)
    if (
      (v == null) ||
      ([STRING, ...NUMBER, ...INTEGER, BOOLEAN].includes(typeof v))
    ) return { type: VALUE, const: v }
    else
      return false
  }
  catch (e) {
    return false
  }
}

export const putAnchor = (sch, opts = {}) => {
  let newSch = sch()

  newSch.$anchor ||= uuid()
  if (opts.force) newSch.$anchor = uuid()

  return newSch
}
