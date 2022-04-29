import * as Core from "./core.js"
import { s } from "./registry.js"

export const PKG_NAME = "json"
const MODULE = s({ PKG_NAME }).t

export const OBJECT = 0
export const ARRAY = 1
export const STRING = 2
export const NUMBER = 3
export const BOOLEAN = 4
export const NIL = 5

export const toStr = t => tstr[t]
const tstr = {
  [OBJECT]: "object",
  [ARRAY]: "array",
  [STRING]: "string",
  [NUMBER]: "number",
  [BOOLEAN]: "boolean",
  [NIL]: "nil",
}

const ctor = (ctor_, opts) => Object.assign(ctor_, { m: MODULE }, opts)
export const object = (opts) => ctor({ t: OBJECT, fields: [] }, opts)
export const array = (opts) => ctor({ t: ARRAY, schs: [] }, opts)
export const string = (opts) => ctor({ t: STRING, v: "a" }, opts)
export const number = (opts) => ctor({ t: NUMBER, v: 123 }, opts)
export const boolean = (opts) => ctor({ t: BOOLEAN, v: true }, opts)
export const nil = (opts) => ctor({ t: NIL }, opts)

const scalar = [string, number, boolean, nil]
const container = [object, array]
const all_ = [...container, ...scalar]

export const tops = all_.map(a => a({ tag: Core.TOPLV_TAG, entry: true }))

const sheet = t => lookup[t] || lookup["default"]
const lookup = {
  [OBJECT]: {
    children: {
      allowedSchs: all_.map(a => a()),
      defaultSch: 2
    },
  },
  [ARRAY]: {
    children: { allowedSchs: all_.map(a => a()) }
  }
}

export const structSheet = { sheet, toStr }
