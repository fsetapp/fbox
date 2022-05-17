import { ifDefined } from "lit-html/directives/if-defined.js"
import * as Diff from "../sch/diff.js"

export const ifTagdata = (tag) => ifDefined(tagdata(tag))
export const tagdata = (tag) => tag

export const diffdata = (_diff) => {
  let diffchar

  if (!_diff) return ""
  for (let k of Object.keys(_diff))
    switch (k) {
      case Diff.NEW: diffchar = "N"; break
      case Diff.REMOVED: diffchar = "R"; break
      case Diff.MOVED: diffchar = "M"; break
      case Diff.NEW_ORDER: diffchar = "O"; break
      case Diff.NEW_KEY: diffchar = "C"; break
      case Diff.NEW_TYPE: diffchar = "C"; break
      case Diff.ENTRY_MARKED: diffchar = "C"; break
    }

  return ifDefined(diffchar)
}
