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
  escapeEdit,
  clickSelect,

  expandSelected,
  collapseSelected
} from "../actions.js"

import { getFileStore, anchorsModels, walkFmodel, FILE_TAG, PROJECT_TAG } from "./store.js"
import * as T from "../sch/type.js"
import { save as saveSchMeta } from "../sch/meta.js"
import { update as updateSch } from "../sch.js"
import { FmodelTree, SchMetaForm, blankTree, blankSchMetaForm } from "../elements.js"

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
  // Keep in mind before this function is called project already renders once.
  switch (command) {
    case activateEditKey:
    case reorderUp:
    case reorderDown:
    case selectMultiNodeUpTo:
    case selectMultiNodeDownTo:
    case selectMultiNodeUp:
    case selectMultiNodeDown:
    case selectRoot:
      break
    case addSch:
    case deleteSelected:
    case cloneUp:
    case cloneDown:
    case submitEdit:
    case clickSelect:
    case selectUpEnd:
    case selectDownEnd:
    case selectUp:
    case selectDown:
    case selectLast:
      changeFile(projectStore, filename)
      break
    // `paste` currently already select fmodelTree (dst)
    case paste:
      projectStore.render()
      break
  }
}

const fmodelController = (projectStore, filename, target, command, runDiff) => {
  switch (command) {
    case selectRoot:
    case selectMultiNodeUpTo:
    case selectMultiNodeDownTo:
    case selectMultiNodeUp:
    case selectMultiNodeDown:
    case reorderUp:
    case reorderDown:
    case expandSelected:
    case collapseSelected:
    case escapeEdit:
    case activateEditKey:
    case activateEditType:
    case cut:
    case copy:
      return
  }

  let fileStore = getFileStore(projectStore, filename)

  switch (target.dataset.tag) {
    case FILE_TAG:
      switch (command) {
        case addSch:
        case paste:
          fileStore._models = anchorsModels(projectStore)
          projectStore.render()
          break
      }
      break
    case T.FMODEL_TAG:
      switch (command) {
        case markAsEntry:
          unmarkEntriesExcept(target, projectStore, filename)
          fileStore.render()
          break
        case deleteSelected:
          fileStore._models = anchorsModels(projectStore)
          projectStore.render()
          break
        case cloneUp:
        case cloneDown:
          unmarkEntriesExcept(target, projectStore, filename)
          fileStore._models = anchorsModels(projectStore)
          fileStore.render()
          projectStore.render()
          break
      }
      break
  }

  fileStore.renderSchMeta()
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
  } else if (projectStore.fields.length == 0) {
    let fmodelTree = document.querySelector("[id='fmodel'] [role='tree']")
    blankTree("[id='fmodel']")
    blankSchMetaForm("[id='fsch']")
  }
}

const unmarkEntriesExcept = (target, projectStore, filename) => {
  // Only store the latest entrypoint, and delete all previous ones
  // We only allow one entry point for now
  if (target.dataset.tag == T.FMODEL_TAG) {
    walkFmodel(projectStore, (fmodel, m) => {
      if (m.path != `[${filename}]${target.id}` && fmodel.isEntry)
        delete fmodel.isEntry
      return fmodel
    })
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

export const isDiffableCmd = (cmdname) => [
  addSch, deleteSelected, submitEdit, paste,
  cloneUp, cloneDown, reorderUp, reorderDown,
  deleteSelected, markAsEntry
].map(cmd => cmd.name).includes(cmdname)
