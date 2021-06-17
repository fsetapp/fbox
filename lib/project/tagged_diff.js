import * as Sch from "../sch.js"
import * as T from "../sch/type.js"
import * as Diff from "../sch/diff.js"
import { FILE_TAG, PROJECT_TAG } from "./store.js"
import { readable } from "../utils.js"

const { assign } = Object

export const taggedDiff = (projectStore, f) => {
  let findFileMap = {}
  const findFile = (fmodelKey) => {
    if (findFileMap[fmodelKey]) return findFileMap[fmodelKey]

    for (let file of projectStore.fields)
      for (let fmodel of file.fields) {
        findFileMap[fmodel.key] = { file: file, fmodelDst: fmodel }
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
  const simpleFmodel = (fmodel) => fmodel

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
        added.fmodels[`[${file.key}][${fmodel.key}]`] = assign(simpleFmodel(fmodel), { pa: file_.$a })
    }
    if (file._diff[Diff.REMOVED])
      removed.files[filePath] = { $a: file_.$a }

    if (file._diff[Diff.NEW_KEY])
      changed.files[filePath] = file_

    if (file._diff[Diff.NEW_ORDER])
      for (let file of projectStore.fields)
        reorder.files[`[${file.key}]`] = simpleFile(file)

    if (file._diff[Diff.MOVED])
      console.log("project does not permit as parent for moving items")

    if (file._diff[Diff.NEW_TYPE])
      console.log("file type is always record, cannot be changed")
  }

  for (let i = 0; i < toUpdateSchs.fmodels.length; i++) {
    let fmodel = toUpdateSchs.fmodels[i]
    let fmodel_ = simpleFmodel(fmodel)
    let fmodelPath = fmodel._diff.meta.path
    let fileAnchor = fmodel._diff.meta.pa

    if (fmodel._diff[Diff.NEW])
      added.fmodels[fmodelPath] = assign(fmodel_, { pa: fileAnchor })
    // Note: file order update is in `changed.files` scope, associated fact in diff scope is quite fragile

    if (fmodel._diff[Diff.REMOVED])
      removed.fmodels[fmodelPath] = { $a: fmodel_.$a, pa: fileAnchor }

    if (fmodel._diff[Diff.NEW_KEY] || fmodel._diff[Diff.NEW_TYPE] || fmodel._diff[Diff.ENTRY_MARKED]) {
      changed.fmodels[fmodelPath] = assign(fmodel_, { pa: fileAnchor })
    }

    if (fmodel._diff[Diff.NEW_ORDER]) {
      let foundFile = findFile(fmodel.key)
      // Collect all fmodels of file once, as a cache for incoming same-file fmodels.
      if (!reorder.fmodels[`[${foundFile.file.key}][${foundFile.fmodelDst.key}]`])
        for (let fmodel of foundFile.file.fields)
          reorder.fmodels[`[${foundFile.file.key}][${fmodel.key}]`] = {
            $a: fmodel.$a, t: fmodel.t, key: fmodel.key, index: fmodel.index, pa: foundFile.file.$a
          }
    }

    if (fmodel._diff[Diff.MOVED]) {
      let { oldParent, newParent, oldPath, newPath } = fmodel._diff[Diff.MOVED]

      // update oldParent and fmodel
      switch (projectStore.taggedLevel[oldParent.level]) {
        case PROJECT_TAG:
          console.log("fmodel was not possible to be a file")
          break
        case FILE_TAG:
          var file = projectStore.fields.find(file => file.key == oldParent.key)

          var file_ = simpleFile(file)
          changed.files[oldParent.path] = file_
          removed.fmodels[oldPath] = { $a: fmodel.$a, pa: file_.$a }
          break
        case T.FMODEL_TAG:
          var foundFile = findFile(oldParent.key)

          var file_ = (foundFile.file)
          changed.fmodels[oldParent.path] = assign(simpleFmodel(foundFile.fmodelDst), { pa: file_.$a })
          break
        default:
          var fmodelDst = findFmodel(oldParent.path)
          var foundFile = findFile(fmodelDst.key)

          var file_ = (foundFile.file)
          changed.fmodels[fmodelDst._meta.path] = assign(simpleFmodel(fmodelDst), { pa: file_.$a })
      }

      // update newParent and fmodel
      switch (projectStore.taggedLevel[newParent.level]) {
        case FILE_TAG:
          var file = projectStore.fields.find(file => file.key == newParent.key)

          var file_ = simpleFile(file)
          added.fmodels[newPath] = assign(fmodel_, { pa: file_.$a })
          break
        default:
          console.log("fmodel parent can only be file tag")
      }
    }
  }

  for (let i = 0; i < toUpdateSchs.subfmodels.length; i++) {
    let subfmodel = toUpdateSchs.subfmodels[i]
    let subfmodelPath = subfmodel._diff.meta.path

    if (subfmodel._diff[Diff.NEW] ||
      subfmodel._diff[Diff.REMOVED] ||
      subfmodel._diff[Diff.NEW_ORDER] ||
      subfmodel._diff[Diff.NEW_KEY] ||
      subfmodel._diff[Diff.NEW_TYPE]) {

      let fmodelDst = findFmodel(subfmodelPath)
      let foundFile = findFile(fmodelDst.key)

      let file_ = (foundFile.file)
      changed.fmodels[fmodelDst._meta.path] = assign(simpleFmodel(fmodelDst), { pa: file_.$a })
    }

    if (subfmodel._diff[Diff.MOVED]) {
      let { oldParent, newParent, oldPath, newPath } = subfmodel._diff[Diff.MOVED]

      // update oldParent and subfmodel
      switch (projectStore.taggedLevel[oldParent.level]) {
        case PROJECT_TAG:
          console.log("subfmodel was not possible to be a file")
          break
        case FILE_TAG:
          var file = projectStore.fields.find(file => file.key == oldParent.key)

          var file_ = simpleFile(file)
          removed.fmodels[oldPath] = { $a: subfmodel.$a, pa: file_.$a }
          break
        case T.FMODEL_TAG:
        default:
          var fmodelDst = findFmodel(oldParent.path)
          var foundFile = findFile(fmodelDst.key)

          var file_ = simpleFile(foundFile.file)
          changed.fmodels[fmodelDst._meta.path] = assign(simpleFmodel(fmodelDst), { pa: file_.$a })
      }

      // update newParent and subfmodel
      switch (projectStore.taggedLevel[newParent.level]) {
        case PROJECT_TAG:
          console.log("subfmodel parent can only be fmodel or subfmodel")
          break
        case FILE_TAG:
          console.log("subfmodel parent can only be fmodel or subfmodel")
          break
        case T.FMODEL_TAG:
        default:
          var fmodelDst = findFmodel(newPath)
          var foundFile = findFile(fmodelDst.key)

          var file_ = (foundFile.file)
          changed.fmodels[fmodelDst._meta.path] = assign(simpleFmodel(fmodelDst), { pa: file_.$a })
      }
    }
  }

  console.log({ changed, added, removed, reorder })
  return f({ changed, added, removed, reorder })
}
