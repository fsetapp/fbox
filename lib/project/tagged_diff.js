import * as Sch from "../sch.js"
import * as T from "../sch/type.js"
import * as Diff from "../sch/diff.js"
import { FILE_TAG, PROJECT_TAG } from "./store.js"
import { readable, forEach, find } from "../utils.js"

const { assign } = Object

export const taggedDiff = (projectStore, f) => {
  let findFileMap = {}
  const findFile = (fmodelKey) => {
    if (findFileMap[fmodelKey]) return findFileMap[fmodelKey]

    for (let file of projectStore.fields)
      for (let fmodel of file.fields) {
        findFileMap[fmodel.key] = { file: file, fmodelOf: fmodel }
        if (fmodel.key == fmodelKey) return findFileMap[fmodelKey]
      }
  }
  const findFmodel = (fmodelPath) => {
    return Sch.getByAndUpdate(projectStore, (a, m) => {
      if (projectStore.taggedLevel[m.level] == T.FMODEL_TAG && m.path != "")
        return fmodelPath.startsWith(m.path)
    }, (a, m) => { readable(a, "_meta", m); return a })
  }

  const simpleFile = ({ $a, key, index, t }) => ({ $a, key, index, t })
  const simpleProject = (p) => simpleFile(p)

  let diffs = projectStore._diffToRemote
  if (!diffs) return
  // let diffs = Diff.diff(projectStore, projectBaseStore)
  let toUpdateSchs = {}

  // This is all about pushing current state of relevant schs to server.
  // How much data to push is inferred from thy diffs collection.
  // Porject or files container is likely to be pushed less.

  toUpdateSchs.files = []
  toUpdateSchs.fmodels = []
  toUpdateSchs.subfmodels = []
  for (let sch of diffs) {
    let level = projectStore.taggedLevel[sch._diff.meta.level]
    if (level == PROJECT_TAG) toUpdateSchs.project = sch
    else if (level == FILE_TAG) toUpdateSchs.files.push(sch)
    else if (level == T.FMODEL_TAG) toUpdateSchs.fmodels.push(sch)
    else toUpdateSchs.subfmodels.push(sch)
  }

  let changed = {}, added = {}, removed = {}, reorder = {}
  added.files ||= {}
  added.fmodels ||= {}
  removed.files ||= {}
  removed.fmodels ||= {}
  changed.files ||= {}
  changed.fmodels ||= {}
  reorder.files ||= {}
  reorder.fmodels ||= {}

  if (toUpdateSchs.project) {
    changed.project = simpleProject(toUpdateSchs.project)
  }

  for (let i = 0; i < toUpdateSchs.files.length; i++) {
    let file = toUpdateSchs.files[i]
    let file_ = simpleFile(file)
    let filePath = file._diff.meta.path

    if (file._diff[Diff.NEW]) {
      added.files[filePath] = file_

      for (let fmodel of file.fields)
        added.fmodels[`[${file.key}][${fmodel.key}]`] = assign(fmodel, { pa: file_.$a })
    }
    else if (file._diff[Diff.REMOVED])
      removed.files[filePath] = { $a: file_.$a }

    else if (file._diff[Diff.NEW_ORDER])
      forEach(projectStore.fields, (file, i) => {
        reorder.files[`[${file.key}]`] = simpleFile(Object.assign(file, { index: i }))
      })

    else if (file._diff[Diff.MOVED])
      console.log("project does not permit as parent for moving items")

    else {
      if (file._diff[Diff.NEW_KEY])
        changed.files[filePath] = file_

      if (file._diff[Diff.NEW_TYPE])
        console.log("file type is always record, cannot be changed")
    }
  }

  for (let i = 0; i < toUpdateSchs.fmodels.length; i++) {
    let fmodel = toUpdateSchs.fmodels[i]
    let fmodelPath = fmodel._diff.meta.path
    let fileAnchor = fmodel._diff.meta.pa

    if (fmodel._diff[Diff.NEW])
      added.fmodels[fmodelPath] = assign(fmodel, { pa: fileAnchor })
    // Note: file order update is in `changed.files` scope, associated fact in diff scope is quite fragile

    else if (fmodel._diff[Diff.REMOVED])
      removed.fmodels[fmodelPath] = { $a: fmodel.$a, pa: fileAnchor }

    else if (fmodel._diff[Diff.NEW_KEY] || fmodel._diff[Diff.NEW_TYPE] || fmodel._diff[Diff.ENTRY_MARKED]) {
      changed.fmodels[fmodelPath] = assign(fmodel, { pa: fileAnchor })
    }

    else if (fmodel._diff[Diff.NEW_ORDER]) {
      let fileOf = fmodel._diff.meta.lpath[1]

      // Collect all fmodels of file once, as a cache for incoming same-file fmodels.
      if (!reorder.fmodels[`[${fileOf.key}][${fmodel.key}]`])
        forEach(fileOf.fields, (fmodel, i) => {
          reorder.fmodels[`[${fileOf.key}][${fmodel.key}]`] = {
            $a: fmodel.$a, t: fmodel.t, key: fmodel.key, index: i, pa: fileOf.$a
          }
        })
    }

    else if (fmodel._diff[Diff.MOVED]) {
      let { oldParent, newParent, oldPath, newPath } = fmodel._diff[Diff.MOVED]
      let fileOf, fmodelOf, fmodelPath, staleFile, staleFmodel

      // fmodel moved from:
      switch (projectStore.taggedLevel[oldParent.level]) {
        case PROJECT_TAG: console.log("fmodel was not possible to be a file"); break
        case FILE_TAG:
          staleFile = oldParent
          removed.fmodels[oldPath] = { $a: fmodel.$a, pa: staleFile.$a }
          break
        case T.FMODEL_TAG:
        default:
          staleFile = oldParent.lpath[1]
          staleFmodel = oldParent.lpath[2] || oldParent
          fmodelPath = `[${staleFile.key}][${staleFmodel.key}]`

          console.log(oldParent.lpath.map(l => l.key))
          fmodelOf = projectStore._indices?.[staleFmodel.$a] || findFmodel(fmodelPath)
          changed.fmodels[fmodelPath] = assign(fmodelOf, { pa: staleFile.$a })
      }

      // update newParent and fmodel
      switch (projectStore.taggedLevel[newParent.level]) {
        case FILE_TAG:
          fileOf = newParent
          fmodelOf = fmodel

          added.fmodels[newPath] = assign(fmodelOf, { pa: fileOf.$a })
          break
        default:
          console.log("fmodel parent can only be file tag")
      }
    }
  }

  for (let i = 0; i < toUpdateSchs.subfmodels.length; i++) {
    let fileOf, fmodelOf, fmodelPath, staleFile, staleFmodel
    let subfmodel = toUpdateSchs.subfmodels[i]

    if (subfmodel._diff[Diff.NEW] ||
      subfmodel._diff[Diff.REMOVED] ||
      subfmodel._diff[Diff.NEW_ORDER] ||
      subfmodel._diff[Diff.NEW_KEY] ||
      subfmodel._diff[Diff.NEW_TYPE]) {

      fileOf = subfmodel._diff.meta.lpath[1]
      fmodelOf = subfmodel._diff.meta.lpath[2]
      fmodelPath = `[${fileOf.key}][${fmodelOf.key}]`

      if (!added.fmodels[fmodelPath] && !removed.fmodels[fmodelPath])
        changed.fmodels[fmodelPath] ||= assign(fmodelOf, { pa: fileOf.$a })
    }

    else if (subfmodel._diff[Diff.MOVED]) {
      let { oldParent, newParent, oldPath, newPath } = subfmodel._diff[Diff.MOVED]

      // subfmodel moved from parent:
      switch (projectStore.taggedLevel[oldParent.level]) {
        // was a file
        case PROJECT_TAG: console.log("subfmodel was not possible to be a file"); break
        // was a fmodel
        case FILE_TAG:
          staleFile = oldParent
          removed.fmodels[oldPath] = { $a: subfmodel.$a, pa: staleFile.$a }
          break
        // was a subfmodel
        case T.FMODEL_TAG:
        default:
          staleFile = oldParent.lpath[1]
          staleFmodel = oldParent.lpath[2] || oldParent
          fmodelPath = `[${staleFile.key}][${staleFmodel.key}]`

          fmodelOf = projectStore._indices?.[staleFmodel.$a] || findFmodel(fmodelPath)
          changed.fmodels[fmodelPath] ||= assign(fmodelOf, { pa: staleFile.$a })
      }

      // to be subfmodel under:
      switch (projectStore.taggedLevel[newParent.level]) {
        case PROJECT_TAG: console.log("subfmodel parent can only be fmodel or subfmodel"); break
        case FILE_TAG: console.log("subfmodel parent can only be fmodel or subfmodel"); break
        case T.FMODEL_TAG:
        default:
          fileOf = newParent.lpath[1]
          fmodelOf = newParent.lpath[2] || find(fileOf.fields, fmodel => newParent.key == fmodel.key)
          fmodelPath = `[${fileOf.key}][${fmodelOf.key}]`

          changed.fmodels[fmodelPath] ||= assign(fmodelOf, { pa: fileOf.$a })
      }
    }
  }

  console.log({ added, changed, removed, reorder, type: "diff_to_persist" })
  return f({ changed, added, removed, reorder })
}
