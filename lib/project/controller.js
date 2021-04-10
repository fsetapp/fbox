import {
  selectMultiNodeUpTo,
  selectMultiNodeDownTo,
  selectMultiNodeUp,
  selectMultiNodeDown,
  selectUpEnd,
  selectDownEnd,
  selectUp,
  selectDown,
  selectRoot,
  selectLast,

  // Basic ops
  addSch,
  activateEditKey,
  activateEditType,
  deleteSelected,
  markAsEntry,

  // Intermediate ops
  cut,
  copy,
  paste,
  cloneUp,
  cloneDown,
  reorderUp,
  reorderDown,

  submitEdit,
  clickSelect
} from "../actions.js"

import { getFileStore, anchorsModels } from "./store.js"
import * as T from "../sch/type.js"
import { save as saveSchMeta } from "../sch/meta.js"
import { update as updateSch } from "../sch.js"
import { FmodelTree, SchMetaForm } from "../elements.js"

export const controller = (projectStore, target, command, runDiff) => {
  let file = target.closest("[data-tag='file']")
  let filename = file?.key

  if (target.closest("[id='project']"))
    projectController(projectStore, filename, command, runDiff)
  else if (target.closest("[id='fmodel']"))
    fmodelController(projectStore, filename, target, command, runDiff)
}

const projectController = (projectStore, filename, command, runDiff) => {
  switch (true) {
    case filename && isContextSwitchedCmd(command.name):
      projectStore._diffToRemote = runDiff()
      changeFile(projectStore, filename)
      projectStore.render()
      break
    case filename && isModelChangedCmd(command.name):
      projectStore._diffToRemote = runDiff()

      let fileStore = getFileStore(projectStore, filename)
      fileStore.render()
      break
    default:
      projectStore._diffToRemote = runDiff()
      projectStore.render()
  }
}

const fmodelController = (projectStore, filename, target, command, runDiff) => {
  let fileStore

  switch (true) {
    case isEntryChangedCmd(command.name):
      // Only store the latest entrypoint, and delete all previous ones
      // We only allow one entry point for now
      if (target.dataset.tag != T.FMODEL_TAG) return
      walkFmodel(projectStore, (fmodel, m) => {
        if (m.path == `[${filename}]${target.id}`) {
          projectStore.entrypoints = {}
          projectStore.entrypoints[fmodel.$anchor] = {}
        } else if (fmodel.isEntry) {
          delete fmodel.isEntry
          delete projectStore.entrypoints[fmodel.$anchor]
        }
        return fmodel
      })

      projectStore._diffToRemote = runDiff()
      fileStore = getFileStore(projectStore, filename)
      fileStore.render()
      break
    case isModelChangedCmd(command.name):
      projectStore._diffToRemote = runDiff()

      fileStore = getFileStore(projectStore, filename)
      fileStore._models = anchorsModels(projectStore, fileStore)
      fileStore.render()
      break
    default:
      projectStore._diffToRemote = runDiff()

      fileStore = getFileStore(projectStore, filename)
      fileStore.render()
      fileStore.renderSchMeta()
  }
}

const changeFile = (projectStore, filename) => {
  let fileStore = getFileStore(projectStore, filename)

  if (fileStore) {
    fileStore._models = anchorsModels(projectStore, fileStore)
    FmodelTree({ store: fileStore, target: "[id='fmodel']" })
    SchMetaForm({ store: fileStore, target: "[id='fsch']", treeTarget: "[id='fmodel']" })

    if (!window._treeClipboard) {
      let fmodelTree = document.querySelector("[id='fmodel'] [role='tree']")
      fmodelTree._aria.clearClipboard(fmodelTree)
    }
  }
}

export const SchMeta = {
  update: ({ store, detail }) => {
    let { path, attrs } = detail
    let sch = updateSch(store, path, (a, m) => saveSchMeta(a, attrs))

    if (store.render) store.render(store)
    Object.assign(store.schMetas, { [sch.$anchor]: sch.metadata })
    if (store.renderSchMeta) store.renderSchMeta(store)

    return sch
  }
}

// Visit less numbers of nodes than Sch.walk (depth-first)
const walkFmodel = (projectStore, fn) => {
  for (let f of Object.keys(projectStore.fields)) {
    let file = projectStore.fields[f]
    for (let m of Object.keys(file.fields)) {
      let fmodel = file.fields[m]
      file.fields[m] = fn(fmodel, { path: `[${file.key}][${fmodel.key}]` })
    }
  }
}

const isContextSwitchedCmd = (cmdname) => [
  selectUp, selectDown, selectUpEnd, selectDownEnd, selectRoot, selectLast, clickSelect,
  cloneUp, cloneDown,
  deleteSelected
].map(cmd => cmd.name).includes(cmdname)

const isModelChangedCmd = (cmdname) => [
  addSch, deleteSelected, submitEdit, paste
].map(cmd => cmd.name).includes(cmdname)

export const isDiffableCmd = (cmdname) => [
  addSch, deleteSelected, submitEdit, paste,
  cloneUp, cloneDown, reorderUp, reorderDown,
  deleteSelected, markAsEntry
].map(cmd => cmd.name).includes(cmdname)

const isEntryChangedCmd = (cmdname) => [
  markAsEntry
].map(cmd => cmd.name).includes(cmdname)
