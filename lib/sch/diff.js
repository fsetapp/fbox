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

      if (foundSch._meta.index != m.index && oldParent.$a == newParent.$a)
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
      // readable(newSch, "_pruned", true)
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
    delete a._visit
    return a
  })

  diffs = diffs.concat(removed)
  return diffs
}

export const mergeToBase = (baseSch, pulled_diff) => {
  baseSch._indices ||= {}

  update_from_diff(baseSch, pulled_diff.changed)
  remove_from_diff(baseSch, pulled_diff.removed)
  insert_from_diff(baseSch, pulled_diff.added)

  return baseSch
}

export const mergeToCurrent = (currentSch, pulled_diff) => {
  update_from_diff(currentSch, pulled_diff.changed)
  remove_from_diff(currentSch, pulled_diff.removed)
  insert_from_diff(currentSch, pulled_diff.added)

  return currentSch
}

const update_from_diff = (currentSch, { fmodels }) => {
  let updated_fmodels = {}

  for (let updated_fmodel of fmodels)
    updated_fmodels[updated_fmodel.$a] = updated_fmodel

  Sch.getByAndUpdate(currentSch, (a, m) => updated_fmodels[a.$a], (a, m) => {
    readable(a, "_meta", m)
    delete a._diff
    return Object.assign(a, updated_fmodels[a.$a])
  })
}

const remove_from_diff = (currentSch, { fmodels }) => {
  let fmodelsMap = {}

  for (let removed_fmodel of fmodels) {
    let { key, index, ...sch } = removed_fmodel
    fmodelsMap[removed_fmodel.pa] ||= []
    fmodelsMap[removed_fmodel.pa].push(sch.$a)
  }

  const anchorToIndex = (a, arr) =>
    arr.reduce((acc, sch) => {
      if (fmodelsMap[a.$a].includes(sch.$a)) acc.push(sch.index)
      return acc
    }, [])

  Sch.pop(currentSch, (a, m) => {
    if (Object.keys(fmodelsMap).length == 0) a._halt = true
    return fmodelsMap[a.$a]
  }, (a, m) => {
    let indices = []
    switch (true) {
      case a.hasOwnProperty("fields"): indices = anchorToIndex(a, a.fields); break
      case a.hasOwnProperty("schs"): indices = anchorToIndex(a, a.schs); break
    }
    delete fmodelsMap[a.$a]
    return indices
  })

  if (currentSch._indices)
    for (let removed_fmodel of fmodels)
      delete currentSch._indices[removed_fmodel.$a]
}

const insert_from_diff = (currentSch, { fmodels }) => {
  let fmodelsMap = {}

  for (let added_fmodel of fmodels) {
    let { key, index, ...sch } = added_fmodel
    fmodelsMap[added_fmodel.pa] ||= []
    fmodelsMap[added_fmodel.pa].push({ k: key, sch: () => sch, index: index })
  }

  Sch.put(currentSch, (a, m) => {
    if (Object.keys(fmodelsMap).length == 0) a._halt = true
    return fmodelsMap[a.$a]
  }, (a, m) => {
    let rawSchs = fmodelsMap[a.$a]
    delete fmodelsMap[a.$a]
    return rawSchs
  })

  if (currentSch._indices)
    for (let added_fmodel of fmodels)
      currentSch._indices[added_fmodel.$a] =
        Sch.getByAndUpdate(currentSch, (a, m) => a.$a == added_fmodel.$a, (a, m) => readable(a, "_meta", m))
}
