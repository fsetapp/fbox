import * as Sch from "../sch.js"
import { readable, writable, reduce } from "../utils.js"

export const NEW = "new"
export const REMOVED = "removed"
export const MOVED = "moved"
export const NEW_ORDER = "order_changed"
export const NEW_KEY = "key_changed"
export const NEW_TYPE = "type_changed"
export const ENTRY_MARKED = "entry_changed"

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

      // if (foundSch.m != newSch.m || (foundSch.m == newSch.m && foundSch.t != newSch.t))
      //   Object.assign(_diff, {
      //     [NEW_TYPE]: { oldType: foundSch.t, newType: newSch.t, parent: newParent }
      //   })
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

      if (!!foundSch.isEntry != !!newSch.isEntry)
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

  mergeIndices(baseStore, pulledDiff)
  return baseStore
}

export const mergeToCurrent = (currentStore, pulledDiff) => {
  currentStore._indices ||= {}

  removeFromDiff(currentStore, pulledDiff.removed)
  insertFromDiff(currentStore, pulledDiff.added)
  updateFromDiff(currentStore, pulledDiff.changed)
  reorderFromDiff(currentStore, pulledDiff.reorder)

  mergeIndices(currentStore, pulledDiff)
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

const updateDiffedSchs = (store, schs, topSchf = (old, new_) => new_) => {
  let schMap = new Map

  for (let updatedSch of schs)
    schMap.set(updatedSch.$a, updatedSch)

  Sch.bulkUpdate(store, (a, m) => {
    if (schMap.size == 0) a._halt = true
    return schMap.get(a.$a)
  }, (a, m) => {
    let new_ = schMap.get(a.$a)
    let metadata = a.metadata
    if (metadata) writable(new_, "metadata", metadata)
    new_ = topSchf(a, new_)
    readable(new_, "_meta", m)

    schMap.delete(a.$a)
    return new_
  })
}

const removeFromDiff = (store, { fmodels, files }) => {
  remove_diffed_schs(store, files, file => file)
  remove_diffed_schs(store, fmodels)
}

const remove_diffed_schs = (store, schs) => {
  let parentMap = new Map

  for (let removedSch of schs) {
    let parent = parentMap.get(removedSch.pa)
    if (!parent) { parent = [], parentMap.set(removedSch.pa, parent) }

    parent.push(removedSch.$a)
  }

  const anchorToIndex = (a, arr) =>
    arr.reduce((acc, sch, i) => {
      if (parentMap.get(a.$a).includes(sch.$a)) acc.push(i)
      return acc
    }, [])

  Sch.pop(store, (a, m) => {
    if (parentMap.size == 0) a._halt = true
    return parentMap.get(a.$a)
  }, (a, m) => {
    let indices = []
    switch (true) {
      case a.hasOwnProperty("fields"): indices = anchorToIndex(a, a.fields); break
      case a.hasOwnProperty("schs"): indices = anchorToIndex(a, a.schs); break
    }
    parentMap.delete(a.$a)
    return indices
  })

  if (store._indices)
    for (let removedSch of schs)
      delete store._indices[removedSch.$a]
}

const insertFromDiff = (store, { fmodels, files }) => {
  insertDiffedSchs(store, files, file => file)
  insertDiffedSchs(store, fmodels)
}

const insertDiffedSchs = (store, schs, schf = a => a) => {
  let parentMap = new Map

  // Build added schs indices of rawSchs
  for (let addedSch of schs) {
    let parent = parentMap.get(addedSch.pa)
    if (!parent) { parent = []; parentMap.set(addedSch.pa, parent) }

    parent.push({ k: addedSch.key, sch: () => Sch.copy(schf(addedSch)), index: addedSch.index })
  }

  // Lookup parent and put rawSchs
  Sch.put(store, (a, m) => {
    if (parentMap.size == 0) a._halt = true
    return parentMap.get(a.$a)
  }, (a, m) => {
    let rawSchs = parentMap.get(a.$a)
    parentMap.delete(a.$a)
    return rawSchs
  })
}

const reorderFromDiff = (store, { fmodels, files }) => {
  reorderDiffedSchs(store, files, file => file)
  reorderDiffedSchs(store, fmodels)
}

const reorderDiffedSchs = (store, schs) => {
  let parentMap = new Map

  for (let reorderedSch of schs) {
    let { $a, index } = reorderedSch
    let parent = parentMap.get(reorderedSch.pa)
    if (!parent) { parent = []; parentMap.set(reorderedSch.pa, parent) }

    parent.push({ $a, index })
  }

  const reorder = (a, arr) => {
    let arrMap = {}
    for (let sch of arr) arrMap[sch.$a] = sch
    return parentMap.get(a.$a).sort((a, b) => a.index - b.index).map(a => arrMap[a.$a])
  }

  Sch.getByAndUpdate(store, (a, m) => {
    if (parentMap.size == 0) a._halt = true
    return parentMap.get(a.$a)
  }, (a, m) => {
    switch (true) {
      case a.hasOwnProperty("fields"): a.fields = reorder(a, a.fields); break
      case a.hasOwnProperty("schs"): a.schs = reorder(a, a.schs); break
    }
    parentMap.delete(a.$a)
    return a
  })
}

const mergeIndices = (store, pulledDiff) => {
  const { added, changed, reorder } = pulledDiff
  let schMap = reduce([
    added.files,
    added.fmodels,
    changed.files,
    changed.fmodels,
    reorder.files,
    reorder.fmodels
  ], (acc, schs) => {
    for (let sch of schs)
      Sch.walk(sch, (a, m) => { acc.set(a.$a, a); return a })
    return acc
  }, new Map)

  // Only re-build indices for coming schMap
  Sch.walk(store, (a, m) => {
    if (schMap.size == 0) a._halt = true

    if (schMap.get(a.$a)) {
      readable(a, "_visit", true)
      readable(a, "_meta", m)
      delete a._diff

      store._indices[a.$a] = a
      schMap.delete(a.$a)
    }
    return a
  })
}
