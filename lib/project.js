import { createStore, initModelView, isContextSwitchedCmd, isModelChangedCmd } from "./main.js"
import * as Sch from "./sch.js"
import * as T from "./sch/type.js"

export { createProjectStore, getFileStore, anchorsModels, projectToStore, handleProjectContext }

const FILE_TAG = "file"
const PROJECT_TAG = "project"

const createProjectStore = () => createStore({
  tag: PROJECT_TAG,
  allowedSchs: [() => createStore({ tag: FILE_TAG, paste: { deny: [FILE_TAG] } })],
  put: { pos: "append" }
})

const getFileStore = (projectStore, filename) =>
  Sch.get(projectStore, `[${filename}]`)


const handleProjectContext = (projectStore, target, filename, command) => {
  if (target.closest("[id='project']") && filename != "")
    switch (true) {
      case isContextSwitchedCmd(command.name):
        changeFile(projectStore, filename)
        break
      case ["addSch", "submitEdit"].includes(command.name):
        let fileStore = Sch.get(projectStore, `[${filename}]`)
        let fmodelTree = document.querySelector("[id='fmodel'] [role='tree']")
        fmodelTree._render(fileStore)
    }
  else if (target.closest("[id='fmodel']"))
    switch (true) {
      case isModelChangedCmd(command.name):
        let fileStore = Sch.get(projectStore, `[${filename}]`)
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
const fileToStore = (file, store) => {
  for (let fmodel of file.fmodels) store.fields[fmodel.key] = fmodel.sch
  store.key = file.key
  store.order = file.order
  return T.putAnchor(() => store)
}

const projectToStore = (project, store) => {
  for (let file of project.files)
    store.fields[file.key] = fileToStore(file, createStore({ tag: FILE_TAG, paste: { deny: [FILE_TAG] } }))

  store.key = project.key
  store.order = project.order
  return T.putAnchor(() => store)
}

const changeFile = (projectStore, filename) => {
  let fileStore = Sch.get(projectStore, `[${filename}]`)

  if (fileStore?._box == FILE_TAG) {
    fileStore._models = anchorsModels(projectStore, fileStore)
    initModelView({ store: fileStore, target: "[id='fmodel']", metaSelector: "sch-meta" })

    if (!window._treeClipboard) {
      let fmodelTree = document.querySelector("[id='fmodel'] [role='tree']")
      fmodelTree._aria.clearClipboard(fmodelTree)
    }
  }
}
