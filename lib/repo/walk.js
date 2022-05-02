import * as Sch from "../sch.js"
import { readable, forEach } from "../utils.js"
import { FILE_TAG } from "../pkgs/proj.js"

//  Visit less numbers of nodes than Sch.walk (depth-first)
export const walkFmodel = (projectStore, fn) =>
  Sch.walk(projectStore, (a, m) => {
    if (a.tag == FILE_TAG) {
      forEach(a.fields, (toplv) => {
        toplv = fn(toplv, { path: `[${a.key}][${toplv.key}]`, file: a }) || toplv
      })
      readable(a, "_pruned", true)
    }
    return a
  })

export const walkFile = (projectStore, fn) =>
  Sch.walk(projectStore, (a, m) => {
    if (a.tag == FILE_TAG) {
      a = fn(a, m)
      readable(a, "_pruned", true)
    }
    return a
  })
