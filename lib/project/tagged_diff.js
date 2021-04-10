import * as Sch from "../sch.js"
import * as T from "../sch/type.js"
import * as Diff from "../sch/diff.js"
import { FILE_TAG, PROJECT_TAG } from "./store.js"
import { isDiffableCmd } from "./controller.js"

export const taggedDiff = (projectStore, command, f) => {
  if (!isDiffableCmd(command.name)) return

  const findFile = (fmodelKey) => {
    for (let k of Object.keys(projectStore.fields))
      if (projectStore.fields[k].fields[fmodelKey]) {
        return {
          file: projectStore.fields[k],
          fmodelDst: projectStore.fields[k].fields[fmodelKey]
        }
      }
  }
  const findFmodel = (fmodelPath) => {
    return Sch.getByAndUpdate(projectStore, (a, m) => {
      if (projectStore.taggedLevel[m.level] == T.FMODEL_TAG && m.path != "")
        return fmodelPath.startsWith(m.path)
    }, (a, m) => { a._meta = m; return a })
  }

  const simpleFile = ({ $anchor, key, order, type }) => ({ $anchor, key, order, type })
  const simpleProject = (p) => simpleFile(p)
  const simpleFmodel = (fmodel) => fmodel

  let diffs = projectStore._diffToRemote
  // let diffs = Diff.diff(projectStore, projectBaseStore)
  let toUpdateSchs = {}

  // This is all about pushing current state of relevant schs to server.
  // How much data to push is inferred from thy diffs collection.
  // Porject or files container is likely to be pushed less.

  toUpdateSchs.files = []
  toUpdateSchs.fmodels = []
  toUpdateSchs.subfmodels = []
  for (let sch of diffs) {
    let level = projectStore.taggedLevel[sch._meta.level]

    if (level == PROJECT_TAG) toUpdateSchs.project = sch
    else if (level == FILE_TAG) toUpdateSchs.files.push(sch)
    else if (level == T.FMODEL_TAG) toUpdateSchs.fmodels.push(sch)
    else toUpdateSchs.subfmodels.push(sch)
  }

  let changed = {}, added = {}, removed = {}

  if (toUpdateSchs.project) {
    changed.project = simpleProject(toUpdateSchs.project)
  }

  for (let i = 0; i < toUpdateSchs.files.length; i++) {
    let file = toUpdateSchs.files[i]
    let file_ = simpleFile(file)

    added.files ||= {}
    removed.files ||= {}
    changed.files ||= {}

    added.fmodels ||= {}
    removed.fmodels ||= {}

    if (file._diff[Diff.NEW]) {
      added.files[file._meta.path] = { ...file_, parentAnchor: file._diff[Diff.NEW].parent.$anchor }

      for (let k of Object.keys(file.fields))
        added.fmodels[`[${file.key}][${k}]`] = { ...simpleFmodel(file.fields[k]), parentAnchor: file_.$anchor }
    }
    if (file._diff[Diff.REMOVED]) {
      removed.files[file._meta.path] = { $anchor: file_.$anchor, parentAnchor: file._diff[Diff.REMOVED].parent.$anchor }

      for (let k of Object.keys(file.fields))
        removed.fmodels[`[${file.key}][${k}]`] = { $anchor: file.fields[k].$anchor, parentAnchor: file_.$anchor }
    }
    if (file._diff[Diff.NEW_ORDER] || file._diff[Diff.NEW_KEY])
      changed.files[file._meta.path] = file_

    if (file._diff[Diff.MOVED])
      console.log("project does not permit as parent for moving items")

    if (file._diff[Diff.NEW_TYPE])
      console.log("file type is always record, cannot be changed")
  }

  for (let i = 0; i < toUpdateSchs.fmodels.length; i++) {
    let fmodel = toUpdateSchs.fmodels[i]
    let fmodel_ = simpleFmodel(fmodel)
    changed.files ||= {}

    added.fmodels ||= {}
    removed.fmodels ||= {}
    changed.fmodels ||= {}

    if (fmodel._diff[Diff.NEW])
      added.fmodels[fmodel._meta.path] = { ...fmodel_, parentAnchor: fmodel._diff[Diff.NEW].parent.$anchor }
    // Note: file order update is in `changed.files` scope, associated fact in diff scope is quite fragile

    if (fmodel._diff[Diff.REMOVED])
      removed.fmodels[fmodel._meta.path] = { $anchor: fmodel_.$anchor, parentAnchor: fmodel._diff[Diff.REMOVED].parent.$anchor }

    if (fmodel._diff[Diff.NEW_ORDER] || fmodel._diff[Diff.NEW_KEY] || fmodel._diff[Diff.NEW_TYPE] || fmodel._diff[Diff.ENTRY_MARKED])
      changed.fmodels[fmodel._meta.path] = { ...fmodel_, parentAnchor: fmodel._meta.parent.$anchor }

    if (fmodel._diff[Diff.MOVED]) {
      let { oldParent, newParent } = fmodel._diff[Diff.MOVED]

      // update oldParent and fmodel
      switch (projectStore.taggedLevel[oldParent.level]) {
        case PROJECT_TAG:
          console.log("fmodel cannot be moved from project as direct child")
          break
        case FILE_TAG:
          var file = projectStore.fields[oldParent.key]

          var file_ = simpleFile(file)
          changed.files[file._meta.path] = file_
          removed.fmodels[fmodel._meta.path] = { $anchor: fmodel.$anchor, parentAnchor: file_.$anchor }
          break
        case T.FMODEL_TAG:
          var foundFile = findFile(oldParent.key)

          var file_ = (foundFile.file)
          changed.fmodels[foundFile.fmodelDst._meta.path] = { ...simpleFmodel(foundFile.fmodelDst), parentAnchor: file_.$anchor }
          break
        default:
          var fmodelDst = findFmodel(oldParent.path)
          var foundFile = findFile(fmodelDst.key)

          var file_ = (foundFile.file)
          changed.fmodels[fmodelDst._meta.path] = { ...simpleFmodel(fmodelDst), parentAnchor: file_.$anchor }
      }

      // update newParent and fmodel
      switch (projectStore.taggedLevel[newParent.level]) {
        case PROJECT_TAG:
          console.log("fmodel cannot be moved to project as direct child")
          break
        case FILE_TAG:
          var file = projectStore.fields[newParent.key]

          var file_ = simpleFile(file)
          changed.files[file._meta.path] = file_
          added.fmodels[fmodel._meta.path] = { ...fmodel_, parentAnchor: file_.$anchor }
          break
        case T.FMODEL_TAG:
          var foundFile = findFile(newParent.key)

          var file_ = (foundFile.file)
          changed.fmodels[foundFile.fmodelDst._meta.path] = { ...simpleFmodel(foundFile.fmodelDst), parentAnchor: file_.$anchor }
          break
        default:
          var fmodelDst = findFmodel(newParent.path)
          var foundFile = findFile(fmodelDst.key)

          var file_ = (foundFile.file)
          changed.fmodels[fmodelDst._meta.path] = { ...simpleFmodel(fmodelDst), parentAnchor: file_.$anchor }
      }
    }
  }

  for (let i = 0; i < toUpdateSchs.subfmodels.length; i++) {
    let subfmodel = toUpdateSchs.subfmodels[i]
    changed.files ||= {}
    added.fmodels ||= {}
    removed.fmodels ||= {}
    changed.fmodels ||= {}

    if (subfmodel._diff[Diff.NEW] ||
      subfmodel._diff[Diff.REMOVED] ||
      subfmodel._diff[Diff.NEW_ORDER] ||
      subfmodel._diff[Diff.NEW_KEY] ||
      subfmodel._diff[Diff.NEW_TYPE]) {

      let fmodelDst = findFmodel(subfmodel._meta.path)
      let foundFile = findFile(fmodelDst.key)

      let file_ = (foundFile.file)
      changed.fmodels[fmodelDst._meta.path] = { ...simpleFmodel(fmodelDst), parentAnchor: file_.$anchor }
    }

    if (subfmodel._diff[Diff.MOVED]) {
      let { oldParent, newParent } = subfmodel._diff[Diff.MOVED]

      // update oldParent and subfmodel
      switch (projectStore.taggedLevel[oldParent.level]) {
        case PROJECT_TAG:
          console.log("subfmodel cannot be moved from project as direct child")
          break
        case FILE_TAG:
          var file = projectStore.fields[oldParent.key]

          var file_ = simpleFile(file)
          changed.files[file._meta.path] = file_
          removed.fmodels[subfmodel._meta.path] = { $anchor: subfmodel.$anchor, parentAnchor: file_.$anchor }
          break
        case T.FMODEL_TAG:
        default:
          var fmodelDst = findFmodel(oldParent.path)
          var foundFile = findFile(fmodelDst.key)

          var file_ = simpleFile(foundFile.file)
          changed.fmodels[fmodelDst._meta.path] = { ...simpleFmodel(fmodelDst), parentAnchor: file_.$anchor }
      }

      // update newParent and subfmodel
      switch (projectStore.taggedLevel[newParent.level]) {
        case PROJECT_TAG:
          console.log("subfmodel cannot be moved to project as direct child")
          break
        case FILE_TAG:
          var fmodelDst = findFmodel(subfmodel._meta.path)
          var foundFile = findFile(fmodelDst.key)

          var file_ = simpleFile(file)
          changed.files[foundFile.file._meta.path] = file_
          added.fmodels[subfmodel._meta.path] = { ...simpleFmodel(subfmodel), parentAnchor: file_.$anchor }
          break
        case T.FMODEL_TAG:
        default:
          var fmodelDst = findFmodel(subfmodel._meta.path)
          var foundFile = findFile(fmodelDst.key)

          var file_ = (foundFile.file)
          changed.fmodels[fmodelDst._meta.path] = { ...simpleFmodel(fmodelDst), parentAnchor: file_.$anchor }
      }
    }
  }

  const minify = (a) => {
    if (!a) return
    let keys = Object.keys(a)
    for (let i = 0; i < keys.length; i++)
      a[keys[i]] = Sch.simplify(a[keys[i]])
  }

  minify(added.fmodels)
  minify(changed.fmodels)

  delete projectStore._diffToRemote
  console.log({ changed, added, removed })
  return f({ changed, added, removed })
}
