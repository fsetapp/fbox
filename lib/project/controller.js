import {
  Selects,

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

import { getFileStore, anchorsModels, walkFmodel } from "./store.js"
import * as T from "../sch/type.js"
import { save as saveSchMeta } from "../sch/meta.js"
import { update as updateSch } from "../sch.js"
import { FmodelTree, SchMetaForm } from "../elements.js"

const {
  selectMultiNodeUpTo,
  selectMultiNodeDownTo,
  selectMultiNodeUp,
  selectMultiNodeDown,
  selectUpEnd,
  selectDownEnd,
  selectUp,
  selectDown,
  selectRoot,
  selectLast } = Selects

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
    case isContextSwitchedCmd(command.name):
      changeFile(projectStore, filename)
      projectStore.render()
      break
    case isModelChangedCmd(command.name):
      changeFile(projectStore, filename)
      projectStore.render()
      break
    case isActivateEdit(command.name):
      changeFile(projectStore, filename)
      projectStore.render()
      break;
    default:
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
        if (m.path != `[${filename}]${target.id}` && fmodel.isEntry)
          delete fmodel.isEntry
        return fmodel
      })

      fileStore = getFileStore(projectStore, filename)
      fileStore.render()
      break
    case isModelChangedCmd(command.name):
      fileStore = getFileStore(projectStore, filename)
      fileStore._models = anchorsModels(projectStore)
      fileStore.render()
      fileStore.renderSchMeta()
      break
    case isJustSelectedCmd(command.name):
      fileStore = getFileStore(projectStore, filename)
      fileStore.render()
      fileStore.renderSchMeta()
  }
}

export const changeFile = (projectStore, filename, fmodelname = null, focus = false) => {
  let fileStore = getFileStore(projectStore, filename)

  if (fileStore) {
    fileStore._models = anchorsModels(projectStore)
    FmodelTree({ store: fileStore, target: "[id='fmodel']", select: fmodelname, focus })
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

    if (sch) {
      if (store.render) store.render(store)
      if (store.renderSchMeta) store.renderSchMeta(store)
    }

    return sch
  }
}

const isJustSelectedCmd = (cmdname) => [
  selectUp, selectDown, selectUpEnd, selectDownEnd, selectRoot, selectLast, clickSelect
].map(cmd => cmd.name).includes(cmdname)

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
  markAsEntry, paste, cloneUp, cloneDown
].map(cmd => cmd.name).includes(cmdname)

const isActivateEdit = (cmdname) => [
  activateEditKey, activateEditType
].map(cmd => cmd.name).includes(cmdname)
