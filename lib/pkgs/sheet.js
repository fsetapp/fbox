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
export const DATA = 5

const toStr = {
  [TYPE]: "type", [DATA]: "data"
}

const { putAnchor, ref } = Core
const ctor = (ctor_, opts) => Object.assign(ctor_, { m: MODULE }, opts)

const func = opts => ctor({ t: FUNC, schs: [putAnchor(result)] }, opts)
const param = opts => ctor({ t: PARAM, schs: [] }, opts)
const result = opts => ctor({ t: RESULT, sch: putAnchor(M.string) }, opts)
// schs[0] = schema
// schs[1] = data
export const data = opts => ctor({ t: DATA, schs: [putAnchor(() => ref(null))] }, opts)

const toVal = ({ m, t, v }, strval) => {
  return null
}

export const tops = [...M.all.map(a => a()), data()]
const sheet = {
}

export const structSheet = { sheet, toStr, toVal, attrs: {} }
