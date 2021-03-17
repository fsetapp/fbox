import { v4 as uuid } from "uuid"

export const RECORD = "record"
export const LIST = "list"
export const TUPLE = "tuple"
export const STRING = "string"
export const NUMBER = "number"
export const INTEGER = "integer"
export const BOOLEAN = "boolean"
export const NULL = "null"
export const UNION = "union"
export const ANY = "any"
export const REF = "ref"
export const VALUE = "value"
export const CONTAINER_TYPES = [RECORD, TUPLE, LIST, UNION]

export const FMODEL_TAG = "fmodel"

export const any = () => ({ type: ANY })
export const string = () => ({ type: STRING })
export const bool = () => ({ type: BOOLEAN })
export const number = () => ({ type: NUMBER })
export const nil = () => ({ type: NULL })
export const record = () => ({ type: RECORD, fields: {}, order: [] })
export const list = () => ({ type: LIST, sch: putAnchor(any) })
export const tuple = () => ({ type: TUPLE, schs: [putAnchor(any)] })
export const union = () => ({ type: UNION, schs: [putAnchor(any)] })
export const ref = (anchor) => ({ type: REF, $ref: anchor })
export const value = (v) => {
  try {
    v = JSON.parse(v)
    if (
      (v == null) ||
      ([STRING, NUMBER, BOOLEAN].includes(typeof v))
    ) return { type: VALUE, const: v }
    else
      return false
  }
  catch (e) {
    return false
  }
}

export const putAnchor = (sch, box, opts = { force: false }) => {
  let newSch = sch()

  newSch.$anchor ||= uuid()
  if (opts.force) newSch.$anchor = uuid()

  return newSch
}
