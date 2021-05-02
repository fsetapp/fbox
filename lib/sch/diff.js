import * as Sch from "../sch.js"
import { readable } from "../utils.js"

export const NEW = "new"
export const REMOVED = "removed"
export const MOVED = "moved"
export const NEW_ORDER = "order_changed"
export const NEW_KEY = "key_changed"
export const NEW_TYPE = "type_changed"
export const ENTRY_MARKED = "entry_changed"

export const buildBaseIndices = (baseSch) => {
  let base = {}
  Sch.walk(baseSch, (a, m) => {
    readable(a, "_meta", m)
    Object.assign(base, { [a.$anchor]: a })
    delete a._visit
    return a
  })
  baseSch._indices = base
}
export const diff = (currentSch, baseSch, opts = {}) => {
  let diffs = []
  let base = baseSch._indices

  Sch.walk(currentSch, (newSch, m) => {
    Object.defineProperty(newSch, "_diff", { value: {}, writable: true, configurable: true })

    let foundSch = base[newSch.$anchor]
    if (foundSch) {
      let newParent = m.parent
      let oldParent = foundSch._meta.parent

      if (oldParent.$anchor != newParent.$anchor)
        Object.assign(newSch._diff ||= {}, {
          [MOVED]: { oldParent: oldParent, newParent: newParent, oldPath: foundSch._meta.path, newPath: m.path }
        })

      if (foundSch.index != newSch.index)
        Object.assign(newSch._diff ||= {}, {
          [NEW_ORDER]: { oldOrder: foundSch.index, newOrder: newSch.index }
        })

      if (foundSch.type != newSch.type)
        Object.assign(newSch._diff ||= {}, {
          [NEW_TYPE]: { oldType: foundSch.type, newType: newSch.type, parent: newParent }
        })
      if (foundSch.$ref != newSch.$ref)
        Object.assign(newSch._diff ||= {}, {
          [NEW_TYPE]: { oldType: foundSch.$ref, newType: newSch.$ref, parent: newParent }
        })
      if (foundSch.const != newSch.const)
        Object.assign(newSch._diff ||= {}, {
          [NEW_TYPE]: { oldType: foundSch.const, newType: newSch.const, parent: newParent }
        })

      if (foundSch.key != newSch.key)
        Object.assign(newSch._diff ||= {}, {
          [NEW_KEY]: { oldKey: foundSch.key, newKey: newSch.key, parent: newParent }
        })

      if (foundSch.isEntry != newSch.isEntry)
        Object.assign(newSch._diff ||= {}, {
          [ENTRY_MARKED]: { oldIsEntry: foundSch.isEntry, newIsEntry: newSch.isEntry, parent: newParent }
        })

      if (newSch._diff) {
        Object.defineProperty(newSch._diff, "meta", { value: { level: m.level, path: m.path, parentAnchor: m.parent.$anchor } })
        diffs.push(newSch)
      }

      foundSch._visit = true
    }
    else {
      newSch._diff = { [NEW]: { parent: m.parent } }

      Object.defineProperty(newSch._diff, "meta", { value: { level: m.level, path: m.path, parentAnchor: m.parent.$anchor } })
      diffs.push(newSch)

      newSch._pruned = true
    }

    return newSch
  })

  let removed = []
  Sch.walk(baseSch, (a, m) => {
    if (!a._visit) {
      a._diff = { [REMOVED]: { parent: m.parent } }
      Object.defineProperty(a._diff, "meta", { value: { level: m.level, path: m.path, parentAnchor: m.parent.$anchor, parentMeta: m.parentMeta } })
      removed.push(a)
      a._pruned = true
    }
    return a
  })

  diffs = diffs.concat(removed)
  return diffs
}
