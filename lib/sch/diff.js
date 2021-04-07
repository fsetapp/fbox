import * as Sch from "../sch.js"
import { jEQ } from "../utils.js"

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
    a._meta = m
    Object.assign(base, { [a.$anchor]: a })
    delete a._visit
    return a
  })

  Sch.walk(currentSch, (newSch, m) => {
    delete newSch._diff
    newSch._meta = m

    let foundSch = base[newSch.$anchor]
    if (foundSch) {
      let newParent = newSch._meta.parent
      let oldParent = foundSch._meta.parent

      if (oldParent.$anchor != newParent.$anchor)
        newSch._diff = { [MOVED]: { oldParent: oldParent, newParent: newParent } }

      if (!jEQ(foundSch.order, newSch.order))
        newSch._diff = {
          [NEW_ORDER]: { oldOrder: foundSch.order, newOrder: newSch.order }
        }

      if (foundSch.type != newSch.type)
        Object.assign(newSch._diff ||= {}, {
          [NEW_TYPE]: { oldType: foundSch.type, newType: newSch.type, parent: newParent }
        })

      if (foundSch.key != newSch.key)
        Object.assign(newSch._diff ||= {}, {
          [NEW_KEY]: { oldKey: foundSch.key, newKey: newSch.key, parent: newParent }
        })

      if (foundSch.isEntry != newSch.isEntry)
        Object.assign(newSch._diff ||= {}, {
          [ENTRY_MARKED]: { oldIsEntry: foundSch.isEntry, newIsEntry: newSch.isEntry, parent: newParent }
        })

      if (newSch._diff) diffs.push(newSch)
      foundSch._visit = true
    }
    else {
      if (!m.path.startsWith(m.parent.prune?.added)) {
        newSch._diff = { [NEW]: { parent: m.parent } }
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
    diffs.push(base[k])
  }

  return diffs
}
