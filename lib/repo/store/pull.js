import { buildBaseIndices } from "./indice.js"
import * as Sch from "../../sch.js"
import { reduce, readable } from "../../utils.js"

export const mergeSchMetas = (projectStore, schMetas) =>
  Sch.walk(projectStore, (a, m) => {
    if (schMetas[a.$a])
      a.metadata = schMetas[a.$a]
    return a
  })

export const mergeReferrers = (projectStore, referrers) => {
  buildBaseIndices(projectStore)
  let lookup = projectStore._indices

  for (let file of projectStore.fields)
    for (let toplv of file.fields)
      if (referrers[toplv.$a]) {
        let referrers_ = reduce(referrers[toplv.$a], (acc, $a) => {
          if (lookup[$a]) acc.push(lookup[$a])
          return acc
        }, [])
        if (referrers_.length != 0) readable(toplv, "referrers", referrers_)
        else delete toplv.referrers
      }
      else delete toplv.referrers
}
