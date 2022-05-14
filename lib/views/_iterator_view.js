import { nothing } from "lit-html"
import { repeat } from "lit-html/directives/repeat.js"

const nextKey = (assigns, sch, i) => `${assigns.path}[${sch.key}]`
const nextIndex = (assigns, sch, i) => `${assigns.path}[][${i}]`

const iterate = (collection, keyFn, pathFn, assigns) =>
  repeat(assigns.ui.itemsFn(collection), (sch) => sch.$a, (sch, i) =>
    assigns.ui.view({
      key: keyFn(sch, i),
      sch: sch,
      parent: assigns.sch,
      ui: { ...assigns.ui, level: assigns.ui.level + 1, index: i, parentPath: assigns.path },
      path: pathFn(assigns, sch, i)
    }))

const viewKeyed = (assigns) => iterate(assigns.sch.fields, (sch, i) => sch.key, nextKey, assigns)
const viewIndexed = (assigns) => iterate(assigns.sch.schs, (sch, i) => i, nextIndex, assigns)
const viewSingled = (assigns) => iterate([assigns.sch.sch], (sch, i) => i, nextIndex, assigns)
const viewNonKeyed = (assigns) => iterate(assigns.sch.schs, (sch, i) => "", nextIndex, assigns)

export const viewItself = (assigns, view, itemsFn = a => a) => {
  Object.assign(assigns.ui, { view, itemsFn })

  if (assigns.ui.depthLimit && assigns.ui.level >= assigns.ui.depthLimit)
    return nothing

  switch (true) {
    case has(assigns.sch, "fields"): return viewKeyed(assigns)
    case has(assigns.sch, "schs"): return viewIndexed(assigns)
    case has(assigns.sch, "sch"): return viewSingled(assigns)
    default: return nothing
  }
}

const has = (obj, prop) => obj.hasOwnProperty(prop)
export const keyedOrIndexed = (sch) => {
  switch (true) {
    case has(sch, "fields"): return "keyed"
    case has(sch, "schs"): return "indexed"
    default: return "none"
  }
}

export const groupSize = (sch) => {
  switch (true) {
    case has(sch, "fields"): return sch.fields.length
    case has(sch, "schs"): return sch.schs.length
    case has(sch, "sch"): return 1
    default: return 0
  }
}
