import * as Core from "./core.js"
import * as M from "./model.js"
import * as Actions from "../actions.js"
import { s } from "./registry.js"

export const PKG_NAME = "sheet"
const MODULE = s({ PKG_NAME }).t

const FUNC = 1
const PARAM = 2
const RESULT = 3
const TYPE = 4
const DATA = 5

const toStr = {
  [TYPE]: "type"
}

const { putAnchor, ref } = Core
const ctor = (ctor_, opts) => Object.assign(ctor_, { m: MODULE }, opts)

const func = opts => ctor({ t: FUNC, schs: [putAnchor(result)] }, opts)
const param = opts => ctor({ t: PARAM, schs: [] }, opts)
const result = opts => ctor({ t: RESULT, sch: putAnchor(M.any) }, opts)
const data = opts => ctor({ t: DATA, v: "" }, opts)

const types = [
  M.string, M.record, M.list, M.tuple, M.taggedUnion, M.union, M.bool, M.integer,
  M.int8, M.int16, M.int32, M.uint8, M.uint16, M.uint32, M.float32, M.float64, M.dict
].reduce((acc, a) => {
  let sch = a()
  acc[sch.t] = sch
  return acc
}, {})


const checkbox = () => { }
const switch_ = () => { }
const email = () => { }
const number = () => { }
const phone = () => { }
const link = () => { }

export const tops = [...Object.values(types)]
const sheet = {
  [FUNC]: {
    children: {
      sequence: [param({ ge: 0 }), result({ n: 1 })]
    }
  },
  [PARAM]: {
    children: {
      anyOf: [
        M.string(), M.record(), M.list(), M.tuple(), M.bool(), M.integer(),
        M.int8(), M.int16(), M.int32(), M.uint8(), M.uint16(), M.uint32(), M.float32(), M.float64(), M.dict()
      ]
    }
  },
  [RESULT]: {
    children: {
      anyOf: [
        M.string(), M.record(), M.list(), M.tuple(), M.bool(), M.integer(),
        M.int8(), M.int16(), M.int32(), M.uint8(), M.uint16(), M.uint32(), M.float32(), M.float64(), M.dict()
      ]
    }
  }
}

export const structSheet = { sheet, toStr, toVal: ({ v }, strval) => strval, attrs: {} }
