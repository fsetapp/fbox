import { fileToStore } from "../project/store.js"
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
  readable(baseSch, "_indices", base)
  return baseSch
}

export const diff = (currentSch, baseSch, opts = {}) => {
  let diffs = []
  let base = baseSch._indices

  Sch.walk(currentSch, (newSch, m) => {
    delete newSch._diff
    let _diff = {}

    let foundSch = base[newSch.$a]
    if (foundSch) {
      let newParent = m.parent
      let oldParent = foundSch._meta.parent

      if (oldParent.$a != newParent.$a)
        Object.assign(_diff, {
          [MOVED]: { oldParent: oldParent, newParent: newParent, oldPath: foundSch._meta.path, newPath: m.path }
        })

      if (foundSch._meta.index != m.index && oldParent.$a == newParent.$a)
        Object.assign(_diff, {
          [NEW_ORDER]: { oldOrder: foundSch.index, newOrder: newSch.index }
        })

      if (foundSch.t != newSch.t)
        Object.assign(_diff, {
          [NEW_TYPE]: { oldType: foundSch.t, newType: newSch.t, parent: newParent }
        })
      if (foundSch.$r != newSch.$r)
        Object.assign(_diff, {
          [NEW_TYPE]: { oldType: foundSch.$r, newType: newSch.$r, parent: newParent }
        })
      if (foundSch.v != newSch.v)
        Object.assign(_diff, {
          [NEW_TYPE]: { oldType: foundSch.v, newType: newSch.v, parent: newParent }
        })

      if (foundSch.key != newSch.key)
        Object.assign(_diff, {
          [NEW_KEY]: { oldKey: foundSch.key, newKey: newSch.key, parent: newParent }
        })

      if (foundSch.isEntry != newSch.isEntry)
        Object.assign(_diff, {
          [ENTRY_MARKED]: { oldIsEntry: foundSch.isEntry, newIsEntry: newSch.isEntry, parent: newParent }
        })

      if (Object.keys(_diff).length != 0) {
        readable(newSch, "_diff", Object.assign(_diff, { meta: diffMeta(m) }))
        diffs.push(newSch)
      }

      readable(foundSch, "_visit", true)
    }
    else {
      readable(newSch, "_diff", { [NEW]: { parent: m.parent }, meta: diffMeta(m) })
      diffs.push(newSch)
    }

    return newSch
  })

  let removed = []
  Sch.walk(baseSch, (a, m) => {
    if (!a._visit) {
      readable(a, "_diff", { [REMOVED]: { parent: m.parent }, meta: diffMeta(m) })
      removed.push(a)
      readable(a, "_pruned", true)
    }
    delete a._visit
    return a
  })

  diffs = diffs.concat(removed)
  return diffs
}

const diffMeta = ({ level, path, lpath, parent }) =>
  ({ level, path, lpath, pa: parent.$a, pt: parent.t })

export const mergeToBase = (baseStore, pulledDiff) => {
  baseStore._indices ||= {}

  removeFromDiff(baseStore, pulledDiff.removed)
  insertFromDiff(baseStore, pulledDiff.added)
  updateFromDiff(baseStore, pulledDiff.changed)
  reorderFromDiff(baseStore, pulledDiff.reorder)

  return baseStore
}

export const mergeToCurrent = (currentStore, pulledDiff) => {
  currentStore._indices ||= {}

  removeFromDiff(currentStore, pulledDiff.removed)
  insertFromDiff(currentStore, pulledDiff.added)
  updateFromDiff(currentStore, pulledDiff.changed)
  reorderFromDiff(currentStore, pulledDiff.reorder)

  return currentStore
}

const updateFromDiff = (store, { fmodels, files }) => {
  updateDiffedSchs(store, files, (file0, file1) => {
    let { key, index } = file1
    return Object.assign(file0, { key, index })
  })
  updateDiffedSchs(store, fmodels, (fmodel0, fmodel1) => {
    if (fmodel0.referrers) readable(fmodel1, "referrers", fmodel0.referrers)
    return fmodel1
  })
}

const updateDiffedSchs = (store, schs, topSchf = a => a) => {
  let topUpdatedSch = {}
  for (let updatedSch of schs)
    topUpdatedSch[updatedSch.$a] = true

  // flatten all schs (subtree) as a lookup
  let schMap1 = {}
  let schMap2 = {}
  for (let updatedSch of schs)
    Sch.walk(updatedSch, (a, m) => {
      schMap1[a.$a] = a
      schMap2[a.$a] = a
      return a
    })

  Sch.walk(store, (a, m) => {
    if (Object.keys(schMap1).length == 0) a._halt = true

    if (schMap1[a.$a]) {
      if (store._indices[a.$a]) {
        let metadata = store._indices[a.$a].metadata
        if (metadata) writable(schMap1[a.$a], "metadata", metadata)
      }
      if (topUpdatedSch[a.$a])
        a = topSchf(a, schMap1[a.$a])
      else
        a = schMap1[a.$a]

      delete schMap1[a.$a]
    }

    return a
  })

  mergeIndices(store, schMap2)
}

const removeFromDiff = (store, { fmodels, files }) => {
  remove_diffed_schs(store, files, file => fileToStore(file))
  remove_diffed_schs(store, fmodels)
}

const remove_diffed_schs = (store, schs) => {
  let parentMap = {}

  for (let removedSch of schs) {
    parentMap[removedSch.pa] ||= []
    parentMap[removedSch.pa].push(removedSch.$a)
  }

  const anchorToIndex = (a, arr) =>
    arr.reduce((acc, sch, i) => {
      if (parentMap[a.$a].includes(sch.$a)) acc.push(i)
      return acc
    }, [])

  Sch.pop(store, (a, m) => {
    if (Object.keys(parentMap).length == 0) a._halt = true
    return parentMap[a.$a]
  }, (a, m) => {
    let indices = []
    switch (true) {
      case a.hasOwnProperty("fields"): indices = anchorToIndex(a, a.fields); break
      case a.hasOwnProperty("schs"): indices = anchorToIndex(a, a.schs); break
    }
    delete parentMap[a.$a]
    return indices
  })

  if (store._indices)
    for (let removedSch of schs)
      delete store._indices[removedSch.$a]
}

const insertFromDiff = (store, { fmodels, files }) => {
  insertDiffedSchs(store, files, file => fileToStore(file))
  insertDiffedSchs(store, fmodels)
}

const insertDiffedSchs = (store, schs, schf = a => a) => {
  let parentMap = {}

  // Build added schs indices of rawSchs
  for (let addedSch of schs) {
    parentMap[addedSch.pa] ||= []
    parentMap[addedSch.pa].push({ k: addedSch.key, sch: () => Sch.copy(schf(addedSch)), index: addedSch.index })
  }

  // Lookup parent and put rawSchs
  Sch.put(store, (a, m) => {
    if (Object.keys(parentMap).length == 0) a._halt = true
    return parentMap[a.$a]
  }, (a, m) => {
    let rawSchs = parentMap[a.$a]
    delete parentMap[a.$a]
    return rawSchs
  })

  // flatten all schs (subtree) as a lookup
  let schMap = {}
  for (let addedSch of schs)
    Sch.walk(addedSch, (a, m) => { schMap[a.$a] = a; return a })

  mergeIndices(store, schMap)
}

const reorderFromDiff = (store, { fmodels, files }) => {
  reorderDiffedSchs(store, files, file => fileToStore(file))
  reorderDiffedSchs(store, fmodels)
}

const reorderDiffedSchs = (store, schs) => {
  let parentMap = {}

  for (let reorderedSch of schs) {
    let { $a, index } = reorderedSch
    parentMap[reorderedSch.pa] ||= []
    parentMap[reorderedSch.pa].push({ $a, index })
  }

  const reorder = (a, arr) => {
    let arrMap = {}
    for (let sch of arr) arrMap[sch.$a] = sch
    return parentMap[a.$a].sort((a, b) => a.index - b.index).map(a => arrMap[a.$a])
  }

  Sch.getByAndUpdate(store, (a, m) => {
    if (Object.keys(parentMap).length == 0) a._halt = true
    return parentMap[a.$a]
  }, (a, m) => {
    switch (true) {
      case a.hasOwnProperty("fields"): a.fields = reorder(a, a.fields); break
      case a.hasOwnProperty("schs"): a.schs = reorder(a, a.schs); break
    }
    delete parentMap[a.$a]
    return a
  })

  let schMap = {}
  for (let reorderedSch of schs)
    schMap[reorderedSch.$a] = reorderedSch

  mergeIndices(store, schMap)
}

const mergeIndices = (store, schMap) =>
  Sch.walk(store, (a, m) => {
    if (Object.keys(schMap).length == 0) a._halt = true

    if (schMap[a.$a]) {
      readable(a, "_visit", true)
      readable(a, "_meta", m)
      store._indices[a.$a] = a

      delete a._diff
      delete schMap[a.$a]
    }
    return a
  })
