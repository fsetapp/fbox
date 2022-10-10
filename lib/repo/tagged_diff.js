import * as Sch from "../sch.js"
import { walkFile } from "../repo/walk.js"
import * as Diff from "../sch/diff.js"
import { readable, forEach, reduce } from "../utils.js"
import * as Core from "../pkgs/core.js"
import * as P from "../pkgs/proj.js"
import { s } from "../pkgs/registry.js"

const { PROJECT, FOLDER, FILE_TAG, PROJECT_TAG, KEEP_EXT } = P
const { TOPLV_TAG } = Core
const { assign } = Object

const is = ({ m, t }, pkg, t_) => m == s(pkg).t && t == t_

export const taggedDiff = (projectStore, f) => {
  let findFileMap = {}
  const findFile = (fmodelKey) => {
    if (findFileMap[fmodelKey]) return findFileMap[fmodelKey]

    walkFile(projectStore, file => {
      for (let fmodel of file.fields)
        if (fmodel.key == fmodelKey) {
          findFileMap[fmodel.key] = { file: file, fmodelOf: fmodel }
          return file
        }

      return file
    })

    return findFileMap[fmodelKey]
  }
  let findFmodelMap = {}
  const findFmodel = (fmodelId) => {
    if (findFmodelMap[fmodelId]) return findFmodelMap[fmodelId]

    return Sch.getByAndUpdate(projectStore, (a, m) => {
      if (a.tag == TOPLV_TAG && m.path != "") {
        // readable(a, "_pruned", true)
        if (fmodelId == a.$a) {
          findFmodelMap[fmodelId] = a
          return true
        }
        else return false
      }
    }, (a, m) => { readable(a, "_meta", m); return a })
  }

  const simpleFile = ({ $a, key, tag, index, m, t, _diff }) => {
    let lpath = _diff.meta.lpath
    lpath.shift()
    lpath.pop()
    lpath.map(({ key, m, t, $a, tag }) => ({ key, m, t, $a, tag }))
    return ({ $a, key, tag, index, m, t, lpath, pa: projectStore.$a })
  }
  const simpleProject = (p) => simpleFile(p)

  let diffs = projectStore._diffToRemote
  if (!diffs) return
  // let diffs = Diff.diff(projectStore, projectBaseStore)
  let toUpdateSchs = {}

  // This is all about pushing current state of relevant schs to server.
  // How much data to push is inferred from thy diffs collection.
  // Porject or files container is likely to be pushed less.

  // toUpdateSchs.folders is a list of top-level folder
  toUpdateSchs.files = []
  toUpdateSchs.folders = []
  toUpdateSchs.fmodels = []
  toUpdateSchs.subfmodels = []

  for (let sch of diffs) {
    if (!sch._diff) console.log("no _diff,", sch)
    else if (!sch.hasOwnProperty("t")) console.log("no t", sch)

    else if (is(sch, P, PROJECT)) toUpdateSchs.project = sch
    else if (is(sch, P, KEEP_EXT)) continue
    else if (is(sch, P, FOLDER)) toUpdateSchs.folders.push(sch)
    else if (sch.tag == FILE_TAG) toUpdateSchs.files.push(sch)
    else if (sch.tag == TOPLV_TAG) toUpdateSchs.fmodels.push(sch)
    else if (!is(sch, P, PROJECT) && !is(sch, P, KEEP_EXT) && !is(sch, P, FOLDER) &&
      ![FILE_TAG, TOPLV_TAG].includes(sch.tag))
      toUpdateSchs.subfmodels.push(sch)
    else
      console.log("discard", sch)
  }

  let changed = {}, added = {}, removed = {}, reorder = {}
  // added.* does not always means a new item literally, it can also means a move
  // We infer added + removed combined as a move at near storage level.
  added.files ||= {}
  added.fmodels ||= {}
  removed.files ||= {}
  removed.fmodels ||= {}
  changed.files ||= {}
  changed.fmodels ||= {}
  reorder.files ||= {} // unused
  reorder.fmodels ||= {}

  if (toUpdateSchs.project) {
    changed.project = simpleProject(toUpdateSchs.project)
  }

  forEach(toUpdateSchs.folders, folder => {
    if (folder._diff[Diff.NEW]) {
      let lpath = folder._diff.meta.lpath
      // this is counter to #buildFolderTree
      lpath.shift() // buildFolderTree: lpath.unshift(projectStore)

      let keep = folder.fields.find(a => is(a, P, KEEP_EXT))
      keep.lpath = lpath
      added.files[keep.$a] = keep
    }
    if (folder._diff[Diff.NEW_KEY]) {
      folder._diff.meta.lpath.shift()
      let baseLpath = folder._diff.meta.lpath

      walkFile(folder, (file, m) => {
        m.lpath.shift()
        let lpath = m.lpath
        lpath.pop()

        lpath.splice(0, 0, ...baseLpath)
        file.lpath = lpath
        changed.files[file.$a] = file
        return file
      })
    }
    if (folder._diff[Diff.REMOVED]) {
      walkFile(folder, (file, m) => {
        removed.files[file.$a] = { $a: file.$a }
        return file
      })
    }
  })

  for (let i = 0; i < toUpdateSchs.files.length; i++) {
    let file = toUpdateSchs.files[i]
    let file_ = simpleFile(file)
    let filePath = file._diff.meta.path

    if (file._diff[Diff.NEW]) {
      added.files[filePath] = file_

      for (let fmodel of file.fields)
        added.fmodels[fmodel._diff.meta.path] = assign(fmodel, { pa: file_.$a })
    }
    else if (file._diff[Diff.REMOVED])
      removed.files[filePath] = { $a: file_.$a }

    // else if (file._diff[Diff.NEW_ORDER])
    //   forEach(projectStore.fields, (file, i) => {
    //     reorder.files[`[${file.key}]`] = simpleFile(Object.assign(file, { index: i }))
    //   })

    else if (file._diff[Diff.MOVED])
      changed.files[filePath] = file_

    else {
      if (file._diff[Diff.NEW_KEY])
        changed.files[filePath] = file_

      if (file._diff[Diff.NEW_TYPE])
        console.log("file type cannot be changed")
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

    else if (fmodel._diff[Diff.NEW_ORDER]) {
      let fileOf = findFile(fmodel.key).file

      // Collect all fmodels of file once, as a cache for incoming same-file fmodels.
      if (!reorder.fmodels[fmodel._diff.meta.path])
        forEach(fileOf.fields, (fmodel, i) => {
          if (fmodel._diff)
            reorder.fmodels[fmodel._diff.meta.path] = {
              $a: fmodel.$a, t: fmodel.t, key: fmodel.key, index: i, pa: fileOf.$a
            }
        })
    }

    else if (fmodel._diff[Diff.MOVED]) {
      let { oldParent, newParent, oldPath, newPath } = fmodel._diff[Diff.MOVED]
      let fileOf, fmodelOf, fmodelPath, staleFile, staleFmodel

      // fmodel moved from:
      switch (oldParent.tag) {
        case PROJECT_TAG: console.log("fmodel was not possible to be a file"); break
        case FILE_TAG:
          staleFile = oldParent
          removed.fmodels[oldPath] = { $a: fmodel.$a, pa: staleFile.$a }
          break
        case TOPLV_TAG:
          let { lpath, ...staleFmodel_ } = oldParent
          staleFmodel = staleFmodel_
        default:
          staleFile = oldParent.lpath.find(a => a.tag == FILE_TAG)
          staleFmodel = staleFmodel || oldParent.lpath.find(a => a.tag == TOPLV_TAG)

          fmodelOf = projectStore._indices?.[staleFmodel.$a] || findFmodel(staleFmodel.$a)
          changed.fmodels[fmodelOf._meta.path] = assign(fmodelOf, { pa: staleFile.$a })
      }

      // update newParent and fmodel
      switch (newParent.tag) {
        case FILE_TAG:
          fileOf = newParent
          fmodelOf = fmodel

          added.fmodels[newPath] = assign(fmodelOf, { pa: fileOf.$a })
          break
        default:
          console.log("fmodel's parent can only be file tag")
      }
    }

    if (added.fmodels[fmodelPath] || removed.fmodels[fmodelPath]) { }
    else if (fmodel._diff[Diff.NEW_KEY] || fmodel._diff[Diff.NEW_TYPE] || fmodel._diff[Diff.ENTRY_MARKED]) {
      changed.fmodels[fmodelPath] = assign(fmodel, { pa: fileAnchor })
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

      staleFile = subfmodel._diff.meta.lpath.find(a => a.tag == FILE_TAG)
      staleFmodel = subfmodel._diff.meta.lpath.find(a => a.tag == TOPLV_TAG)

      if (subfmodel._diff[Diff.NEW]) fmodelOf = findFmodel(staleFmodel.$a)
      fmodelOf ||= projectStore._indices?.[staleFmodel.$a] || findFmodel(staleFmodel.$a)
      fmodelPath = fmodelOf._meta.path
      if (!added.fmodels[fmodelPath] && !removed.fmodels[fmodelPath]) {
        changed.fmodels[fmodelPath] ||= assign(fmodelOf, { pa: staleFile.$a })
      }
    }

    else if (subfmodel._diff[Diff.MOVED]) {
      let { oldParent, newParent, oldPath, newPath } = subfmodel._diff[Diff.MOVED]

      // subfmodel moved from parent:
      switch (oldParent.tag) {
        // was a file
        case PROJECT_TAG: console.log("subfmodel was not possible to be a file"); break
        // was a fmodel
        case FILE_TAG:
          staleFile = oldParent
          removed.fmodels[oldPath] = { $a: subfmodel.$a, pa: staleFile.$a }
          break
        // was a subfmodel
        case TOPLV_TAG:
          let { lpath, ...staleFmodel_ } = oldParent
          staleFmodel = staleFmodel_
        default:
          staleFile = oldParent.lpath.find(a => a.tag == FILE_TAG)
          staleFmodel = staleFmodel || oldParent.lpath.find(a => a.tag == TOPLV_TAG)

          fmodelOf = projectStore._indices?.[staleFmodel.$a] || findFmodel(staleFmodel.$a)
          changed.fmodels[fmodelOf._meta.path] ||= assign(fmodelOf, { pa: staleFile.$a })
      }

      // to be subfmodel under:
      switch (newParent.tag) {
        case PROJECT_TAG: console.log("subfmodel's parent can only be fmodel or subfmodel"); break
        case FILE_TAG: console.log("subfmodel's parent can only be fmodel or subfmodel"); break
        case TOPLV_TAG:
        default:
          fileOf = newParent.lpath.find(a => a.tag == FILE_TAG)
          fmodelOf = newParent.lpath.find(a => a.tag == TOPLV_TAG)

          fmodelOf = projectStore._indices?.[fmodelOf.$a] || findFmodel(fmodelOf.$a)
          changed.fmodels[newParent.path] ||= assign(fmodelOf, { pa: fileOf.$a })
      }
    }
  }

  // console.log({ added, changed, removed, reorder, type: "diff_to_persist" })
  return f({ changed, added, removed, reorder })
}
