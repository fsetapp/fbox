import * as Core from "./core.js"
import { structSheet as modelStructsheet } from "./model.js"
import * as Actions from "../actions.js"
import { s } from "./registry.js"

export const PKG_NAME = "sheet"
const MODULE = s({ PKG_NAME }).t

const { putAnchor, ref } = Core
const ctor = (ctor_, opts) => Object.assign(ctor_, { m: MODULE }, opts)

export const structSheet = { sheet: {}, toStr: {}, toVal: ({ v }, strval) => strval, attrs: {} }
