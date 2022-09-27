import * as Core from "./core.js"
import { s } from "./registry.js"

export const PKG_NAME = "json"
export const MODULE = s({ PKG_NAME }).t

export const OBJECT = 0
export const ARRAY = 1
export const STRING = 2
export const NUMBER = 3
export const BOOLEAN = 4
export const NIL = 5

export const toStr = {
  [OBJECT]: "object",
  [ARRAY]: "array",
  [STRING]: "string",
  [NUMBER]: "number",
  [BOOLEAN]: "boolean",
  [NIL]: "nil",
}

/*
  cast string input as value in this particular module. For example if we support
  date type, the ui would be a datepicker that input datestring, and we could provide
  a function to encode that string into `{ m: MODULE, t: DATE, v: val }`
*/
const toVal = ({ t, v }, strval) => {
  if (v == undefined) return
  const tToType = { [NUMBER]: "number", [STRING]: "string", [BOOLEAN]: "boolean" }

  try {
    const val = JSON.parse(strval)

    if (val == null)
      return nil()
    else if (typeof val == tToType[t])
      return { m: MODULE, t: t, v: val }
    else
      return
  }
  catch (e) { return }
}

const ctor = (ctor_, opts) => Object.assign(ctor_, { m: MODULE }, opts)
export const object = (opts) => ctor({ t: OBJECT, fields: [] }, opts)
export const array = (opts) => ctor({ t: ARRAY, schs: [] }, opts)
export const string = (opts) => ctor({ t: STRING, v: "a" }, opts)
export const number = (opts) => ctor({ t: NUMBER, v: 123 }, opts)
export const boolean = (opts) => ctor({ t: BOOLEAN, v: true }, opts)
export const nil = (opts) => ctor({ t: NIL, v: null }, opts)

const scalar = [string, number, boolean, nil]
const container = [object, array]
const all_ = [...container, ...scalar]

export const tops = {
  anyOf: all_.map(a => a({ tag: Core.TOPLV_TAG, entry: true })),
  n: 1
}

const sheet = {
  [OBJECT]: {
    children: {
      anyOf: all_.map(a => a()),
      defaultSch: 2
    },
  },
  [ARRAY]: {
    children: { anyOf: all_.map(a => a()) }
  }
}

export const structSheet = { sheet, tops, toStr, toVal }
