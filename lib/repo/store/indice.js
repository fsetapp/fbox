import { walkFmodel } from "../walk.js"
import * as Sch from "../../sch.js"
import { readable } from "../../utils.js"

export const buildBaseIndices = (baseSch) => {
  let base = {}
  Sch.walk(baseSch, (a, m) => {
    readable(a, "_meta", m)
    Object.assign(base, { [a.$a]: a })
    delete a._visit
    delete a._pruned

    return a
  })
  readable(baseSch, "_indices", base)
  return baseSch
}

export const anchorsModels = (projectStore) => {
  let modelsAcc = {}
  walkFmodel(projectStore, (fmodel, m) => {
    modelsAcc[fmodel.$a] = { display: [m.file.key, fmodel.key].join(" :: "), file: m.file.key, fmodel: fmodel.key, sch: fmodel }
  })
  return modelsAcc
}
