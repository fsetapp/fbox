import * as Sch from "../sch.js"
import { jEQ, readable } from "../utils.js"

export { diff }

export const NEW = "new"
export const REMOVED = "removed"
export const MOVED = "moved"
export const NEW_ORDER = "order_changed"
export const NEW_KEY = "key_changed"
export const NEW_TYPE = "type_changed"
export const ENTRY_MARKED = "entry_changed"

const diff = (currentSch, baseSch, opts = {}) => {
  let base = {}
  let diffs = []

  Sch.walk(baseSch, (a, m) => {
    readable(a, "_meta", m)
    Object.assign(base, { [a.$anchor]: a })
    delete a._visit
    return a
  })

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

      if (!jEQ(foundSch.index, newSch.index))
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
      if (!m.path.startsWith(m.parent.prune?.added)) {
        newSch._diff = { [NEW]: { parent: m.parent } }

        Object.defineProperty(newSch._diff, "meta", { value: { level: m.level, path: m.path, parentAnchor: m.parent.$anchor } })
        diffs.push(newSch)

        Object.assign(m.parent, { prune: { added: m.path } })
      }
    }

    return newSch
  })

  for (let k of Object.keys(base)) {
    if (base[k]._visit) continue

    let m = base[k]._meta
    let currentPath = m.path
    let superTreeRemoved = diffs.filter(a => a._diff[REMOVED] && currentPath.startsWith(a._meta.path))
    if (superTreeRemoved.length != 0) continue

    base[k]._diff = { [REMOVED]: { parent: m.parent } }
    Object.defineProperty(base[k]._diff, "meta", { value: { level: m.level, path: m.path, parentAnchor: m.parent.$anchor } })
    diffs.push(base[k])
  }

  return diffs
}
