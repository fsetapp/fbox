import { createStore, initModelView, isContextSwitchedCmd, isModelChangedCmd, isDiffableCmd } from "./main.js"
import * as Sch from "./sch.js"
import * as T from "./sch/type.js"
import * as Diff from "./sch/diff.js"

export { createProjectStore, getFileStore, anchorsModels, projectToStore, handleProjectContext, handleProjectRemote }

const FILE_TAG = "file"
const PROJECT_TAG = "project"

const createProjectStore = () => createStore({
  tag: PROJECT_TAG,
  allowedSchs: [emptyFile()],
  put: { pos: "append" }
})

const getFileStore = (projectStore, filename) => {
  let fileStore = Sch.get(projectStore, `[${filename}]`)
  fileStore.schMetas = projectStore.schMetas
  return fileStore
}


const handleProjectRemote = (projectStore, projectBaseStore, command, f) => {
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
      if (a._tag == T.FMODEL_TAG && m.path != "")
        return fmodelPath.startsWith(m.path)
    }, (a, m) => { a._meta = m; return a })
  }

  let diffs = Diff.diff(projectStore, projectBaseStore)
  let toUpdateSchs = {}

  // This is all about pushing current state of relevant schs to server.
  // How much data to push is inferred from thy diffs collection.
  // Porject or files container is likely to be pushed less.

  toUpdateSchs.files = []
  toUpdateSchs.fmodels = []
  toUpdateSchs.subfmodels = []
  for (let sch of diffs) {
    if (sch._tag == PROJECT_TAG) toUpdateSchs.project = sch
    else if (sch._tag == FILE_TAG) toUpdateSchs.files.push(sch)
    else if (sch._tag == T.FMODEL_TAG) toUpdateSchs.fmodels.push(sch)
    else toUpdateSchs.subfmodels.push(sch)
  }

  let changed = {}, added = {}, removed = {}

  if (toUpdateSchs.project) {
    let { fields, ...project_ } = Sch.simplify(toUpdateSchs.project)
    changed.project = project_
  }

  for (let file of toUpdateSchs.files) {
    let { fields, ...file_ } = Sch.simplify(file)
    added.files ||= {}
    removed.files ||= {}
    changed.files ||= {}

    added.fmodels ||= {}
    removed.fmodels ||= {}

    if (file._diff[Diff.NEW]) {
      added.files[file._meta.path] = { ...file_, parentAnchor: file._diff[Diff.NEW].parent.$anchor }

      for (let k of Object.keys(fields))
        added.fmodels[file.fields[k]._meta.path] = { ...fields[k], parentAnchor: file_.$anchor }
    }
    if (file._diff[Diff.REMOVED]) {
      removed.files[file._meta.path] = { $anchor: file_.$anchor, parentAnchor: file._diff[Diff.REMOVED].parent.$anchor }

      for (let k of Object.keys(fields))
        removed.fmodels[file.fields[k]._meta.path] = { $anchor: fields[k].$anchor, parentAnchor: file_.$anchor }
    }
    if (file._diff[Diff.NEW_ORDER] || file._diff[Diff.NEW_KEY])
      changed.files[file._meta.path] = file_

    if (file._diff[Diff.MOVED])
      console.log("file cannot be moved to different parent")

    if (file._diff[Diff.NEW_TYPE])
      console.log("file type is always record, cannot be changed")
  }

  for (let fmodel of toUpdateSchs.fmodels) {
    let fmodel_ = Sch.simplify(fmodel)
    changed.files ||= {}

    added.fmodels ||= {}
    removed.fmodels ||= {}
    changed.fmodels ||= {}

    if (fmodel._diff[Diff.NEW])
      added.fmodels[fmodel._meta.path] = { ...fmodel_, parentAnchor: fmodel._diff[Diff.NEW].parent.$anchor }
    // Note: file order update is in `changed.files` scope, associated fact in diff scope is quite fragile

    if (fmodel._diff[Diff.REMOVED])
      removed.fmodels[fmodel._meta.path] = { $anchor: fmodel_.$anchor, parentAnchor: fmodel._diff[Diff.REMOVED].parent.$anchor }

    if (fmodel._diff[Diff.NEW_ORDER] || fmodel._diff[Diff.NEW_KEY] || fmodel._diff[Diff.NEW_TYPE])
      changed.fmodels[fmodel._meta.path] = { ...fmodel_, parentAnchor: fmodel._meta.parent.$anchor }

    if (fmodel._diff[Diff.MOVED]) {
      let { oldParent, newParent } = fmodel._diff[Diff.MOVED]

      // update oldParent and fmodel
      switch (oldParent._tag) {
        case PROJECT_TAG:
          console.log("fmodel cannot be moved from project as direct child")
          break
        case FILE_TAG:
          var file = projectStore.fields[oldParent.key]

          var { fields, ...file_ } = Sch.simplify(file)
          changed.files[file._meta.path] = file_
          removed.fmodels[fmodel._meta.path] = { $anchor: fmodel.$anchor, parentAnchor: file_.$anchor }
          break
        case T.FMODEL_TAG:
          console.log("impossible for fmodel to have fmodel as parent")
          break
        default:
          console.log("impossible for fmodel to be moved from unknown tag parent")
      }

      // update newParent and fmodel
      switch (newParent._tag) {
        case PROJECT_TAG:
          console.log("fmodel cannot be moved to project as direct child")
          break
        case FILE_TAG:
          var file = projectStore.fields[newParent.key]

          var { fields, ...file_ } = Sch.simplify(file)
          changed.files[file._meta.path] = file_
          added.fmodels[fmodel._meta.path] = { ...fmodel_, parentAnchor: file_.$anchor }
          break
        case T.FMODEL_TAG:
          var foundFile = findFile(newParent.key)

          var file_ = Sch.simplify(foundFile.file)
          added.fmodels[foundFile.fmodelDst._meta.path] = { ...Sch.simplify(foundFile.fmodelDst), parentAnchor: file_.$anchor }
          break
        default:
          var fmodelDst = findFmodel(newParent.path)
          var foundFile = findFile(fmodelDst.key)

          var file_ = Sch.simplify(foundFile.file)
          changed.fmodels[fmodelDst._meta.path] = { ...Sch.simplify(fmodelDst), parentAnchor: file_.$anchor }
      }
    }
  }

  for (let subfmodel of toUpdateSchs.subfmodels) {
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

      let file_ = Sch.simplify(foundFile.file)
      changed.fmodels[fmodelDst._meta.path] = { ...Sch.simplify(fmodelDst), parentAnchor: file_.$anchor }
    }

    if (subfmodel._diff[Diff.MOVED]) {
      let { oldParent, newParent } = subfmodel._diff[Diff.MOVED]

      // update oldParent and subfmodel
      switch (oldParent._tag) {
        case PROJECT_TAG:
          console.log("subfmodel cannot be moved from project as direct child")
          break
        case FILE_TAG:
          var file = projectStore.fields[oldParent.key]

          var { fields, ...file_ } = Sch.simplify(file)
          changed.files[file._meta.path] = file_
          removed.fmodels[subfmodel._meta.path] = { $anchor: subfmodel.$anchor, parentAnchor: file_.$anchor }
          break
        case T.FMODEL_TAG:
        default:
          var fmodelDst = findFmodel(oldParent.path)
          var foundFile = findFile(fmodelDst.key)

          var file_ = Sch.simplify(foundFile.file)
          changed.fmodels[fmodelDst._meta.path] = { ...Sch.simplify(fmodelDst), parentAnchor: file_.$anchor }
      }

      // update newParent and subfmodel
      switch (newParent._tag) {
        case PROJECT_TAG:
          console.log("subfmodel cannot be moved to project as direct child")
          break
        case FILE_TAG:
          var fmodelDst = findFmodel(subfmodel._meta.path)
          var foundFile = findFile(fmodelDst.key)

          var { fields, ...file_ } = Sch.simplify(foundFile.file)
          changed.files[foundFile.file._meta.path] = file_
          added.fmodels[subfmodel._meta.path] = { ...Sch.simplify(subfmodel), parentAnchor: file_.$anchor }
          break
        case T.FMODEL_TAG:
        default:
          var fmodelDst = findFmodel(subfmodel._meta.path)
          var foundFile = findFile(fmodelDst.key)

          var file_ = Sch.simplify(foundFile.file)
          changed.fmodels[fmodelDst._meta.path] = { ...Sch.simplify(fmodelDst), parentAnchor: file_.$anchor }
      }
    }
  }

  console.log({ changed, added, removed })
  return f({ changed, added, removed })
}
const handleProjectContext = (projectStore, target, filename, command) => {
  if (!filename) {
  }
  else if (target.closest("[id='project']"))
    switch (true) {
      case isContextSwitchedCmd(command.name):
        changeFile(projectStore, filename)
        break
      case isModelChangedCmd(command.name):
        let fileStore = getFileStore(projectStore, filename)
        let fmodelTree = document.querySelector("[id='fmodel'] [role='tree']")
        fmodelTree._render(fileStore)
    }
  else if (target.closest("[id='fmodel']"))
    switch (true) {
      case isModelChangedCmd(command.name):
        let fileStore = getFileStore(projectStore, filename)
        fileStore._models = anchorsModels(projectStore, fileStore)
        let fmodelTree = document.querySelector("[id='fmodel'] [role='tree']")
        fmodelTree._render(fileStore)
    }
}

const anchorsModels = (projectStore, fileStore) => {
  let modelsAcc = {}
  for (let filename of projectStore.order) {
    let file = projectStore.fields[filename]

    for (let modelname of file.order)
      modelsAcc[file.fields[modelname].$anchor] = filename != fileStore.key ? `${filename}.${modelname}` : modelname
  }
  return modelsAcc
}

const emptyFile = () =>
  createStore({
    tag: FILE_TAG,
    addDefault: () => createStore({ tag: T.FMODEL_TAG }),
    put: { tag: { [FILE_TAG]: T.FMODEL_TAG, [T.FMODEL_TAG]: undefined } }
  })

const fileToStore = (file, store) => {
  for (let fmodel of file.fmodels) {
    Object.assign(fmodel.sch, {
      $anchor: fmodel.anchor,
      type: fmodel.type,
      key: fmodel.key,
      is_entry: fmodel.is_entry,
      _tag: T.FMODEL_TAG
    })

    store.fields[fmodel.key] = fmodel.sch
  }
  store.key = file.key
  store.order = file.order
  store.$anchor = file.anchor
  return T.putAnchor(() => store)
}

const projectToStore = (project, store) => {
  for (let file of project.files)
    store.fields[file.key] = fileToStore(file, emptyFile())

  store.key = project.key
  store.order = project.order
  store.$anchor = project.anchor
  store.schMetas = project.allmeta
  return T.putAnchor(() => store)
}

const changeFile = (projectStore, filename) => {
  let fileStore = getFileStore(projectStore, filename)

  if (fileStore?._tag == FILE_TAG) {
    fileStore._models = anchorsModels(projectStore, fileStore)
    initModelView({ store: fileStore, target: "[id='fmodel']", metaSelector: "sch-meta" })

    if (!window._treeClipboard) {
      let fmodelTree = document.querySelector("[id='fmodel'] [role='tree']")
      fmodelTree._aria.clearClipboard(fmodelTree)
    }
  }
}
