import * as Core from "./core.js"
import * as Form from "./form.js"
import * as T from "./model.js"

export const PKG_NAME = "string"

export const AT = 0
export const toStr = {
  [AT]: "at"
}

export const at = () => ({ t: AT, schs: [] })

const all = [at]

const sheet = {
  [AT]: {
    nthChild: {
      // Whatever param that return the specified type. It could be literal, ref-to-var, function call.
      0: { param: [T.STRING] },
      1: { param: [T.INTEGER] },
      result: T.STRING
    }
  }
}

export const structSheet = { sheet, toStr }
