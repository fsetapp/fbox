import * as Sch from "../sch.js"
import { readable, writable } from "../utils.js"

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
    Object.assign(base, { [a.$a]: a })
    delete a._visit
    delete a._pruned

    return a
  })
  baseSch._indices = base
  return baseSch
}

export const diff = (currentSch, baseSch, opts = {}) => {
  let diffs = []
  let base = baseSch._indices

  Sch.walk(currentSch, (newSch, m) => {
    writable(newSch, "_diff", {})

    let foundSch = base[newSch.$a]
    if (foundSch) {
      let newParent = m.parent
      let oldParent = foundSch._meta.parent

      if (oldParent.$a != newParent.$a)
        Object.assign(newSch._diff ||= {}, {
          [MOVED]: { oldParent: oldParent, newParent: newParent, oldPath: foundSch._meta.path, newPath: m.path }
        })

      if (foundSch._meta.index != m.index)
        Object.assign(newSch._diff ||= {}, {
          [NEW_ORDER]: { oldOrder: foundSch.index, newOrder: newSch.index }
        })

      if (foundSch.t != newSch.t)
        Object.assign(newSch._diff ||= {}, {
          [NEW_TYPE]: { oldType: foundSch.t, newType: newSch.t, parent: newParent }
        })
      if (foundSch.$r != newSch.$r)
        Object.assign(newSch._diff ||= {}, {
          [NEW_TYPE]: { oldType: foundSch.$r, newType: newSch.$r, parent: newParent }
        })
      if (foundSch.v != newSch.v)
        Object.assign(newSch._diff ||= {}, {
          [NEW_TYPE]: { oldType: foundSch.v, newType: newSch.v, parent: newParent }
        })

      if (foundSch.key != newSch.key)
        Object.assign(newSch._diff ||= {}, {
          [NEW_KEY]: { oldKey: foundSch.key, newKey: newSch.key, parent: newParent }
        })

      if (foundSch.isEntry != newSch.isEntry)
        Object.assign(newSch._diff ||= {}, {
          [ENTRY_MARKED]: { oldIsEntry: foundSch.isEntry, newIsEntry: newSch.isEntry, parent: newParent }
        })

      if (Object.keys(newSch._diff).length != 0) {
        Object.assign(newSch._diff, { meta: { level: m.level, path: m.path, pa: m.parent.$a } })
        diffs.push(newSch)
      }

      readable(foundSch, "_visit", true)
    }
    else {
      newSch._diff = { [NEW]: { parent: m.parent }, meta: { level: m.level, path: m.path, pa: m.parent.$a } }
      diffs.push(newSch)
      readable(newSch, "_pruned", true)
    }

    return newSch
  })

  let removed = []
  Sch.walk(baseSch, (a, m) => {
    writable(a, "_diff", {})

    if (!a._visit) {
      a._diff = { [REMOVED]: { parent: m.parent }, meta: { level: m.level, path: m.path, pa: m.parent.$a } }
      removed.push(a)
      readable(a, "_pruned", true)
    }
    return a
  })

  diffs = diffs.concat(removed)
  return diffs
}
