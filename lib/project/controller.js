import {
  Selects,

  // Basic ops
  addSch,
  addFile,
  addFolder,
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

import { anchorsModels, walkFmodel } from "./store.js"
import { TOPLV_TAG } from "../pkgs/core.js"
import { FILE_TAG, JSON_DATA_EXT, MODEL_EXT, HTML_EXT, JSON_EXT } from "../pkgs/proj.js"

import { save as saveSchMeta } from "../sch/meta.js"
import { update as updateSch } from "../sch.js"
import { FmodelTree, SchMetaForm, blankTree, blankSchMetaForm, DataTree, HTMLTree, JSONTree } from "../elements.js"
import { readable } from "../utils.js"

const {
  selectMultiNodeUpTo,
  selectMultiNodeDownTo,
  selectMultiNodeUp,
  selectMultiNodeDown,
  selectUpEnd,
  selectDownEnd,
  selectUp,
  selectDown,
  selectPrevious,
  selectNext,
  selectRoot,
  selectLast } = Selects

export const controller = (projectStore, target, command, runDiff) => {
  const route = (tree) => !!target.closest(tree)

  switch (true) {
    case route("[id='project']"):
      projectController(projectStore, target, command, runDiff)
      break
    case route("file-body[type='fmodel']"):
      fmodelController(projectStore, target, command, runDiff)
      break
    case route("file-body[type='data']"):
      dataController(projectStore, target, command, runDiff)
      break
  }
}

const projectController = (projectStore, target, command, runDiff) => {
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
    case addFile:
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
      let fileStore = target.closest("[data-tag='file']")?.sch
      changeFile({ projectStore, fileStore })
      break
    // `paste` currently already select fmodelTree (dst)
    case paste:
      projectStore.render()
      break
  }
}

const fmodelController = (projectStore, target, command, runDiff) => {
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

  let fileStore = target.closest("[data-tag='file']")?.sch

  switch (target.dataset.tag) {
    case FILE_TAG:
      switch (command) {
        case addSch:
        case deleteSelected:
        case paste:
          readable(fileStore, "_models", anchorsModels(projectStore))
          projectStore.render()
          break
      }
      break
    case TOPLV_TAG:
      switch (command) {
        case markAsEntry:
          unmarkEntriesExcept(target, projectStore)
          fileStore.render()
          break
        case deleteSelected:
          readable(fileStore, "_models", anchorsModels(projectStore))
          projectStore.render()
          break
        case cloneUp:
        case cloneDown:
          unmarkEntriesExcept(target, projectStore)
          readable(fileStore, "_models", anchorsModels(projectStore))
          fileStore.render()
          projectStore.render()
          break
        case submitEdit:
          readable(fileStore, "_models", anchorsModels(projectStore))
          fileStore.render()
      }
      break
  }

  fileStore.renderSchMeta()
}

const dataController = (projectStore, target, command, runDiff) => {
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

  let fileStore = target.closest("[data-tag='file']")?.sch

  switch (target.dataset.tag) {
    case FILE_TAG:
      switch (command) {
        case addSch:
        case deleteSelected:
        case paste:
          readable(fileStore, "_models", anchorsModels(projectStore))
          projectStore.render()
          break
      }
      break
    case TOPLV_TAG:
      switch (command) {
        case markAsEntry:
          unmarkEntriesExcept(target, projectStore)
          fileStore.render()
          break
        case deleteSelected:
          readable(fileStore, "_models", anchorsModels(projectStore))
          projectStore.render()
          break
        case cloneUp:
        case cloneDown:
          unmarkEntriesExcept(target, projectStore)
          readable(fileStore, "_models", anchorsModels(projectStore))
          fileStore.render()
          projectStore.render()
          break
        case submitEdit:
          readable(fileStore, "_models", anchorsModels(projectStore))
          fileStore.render()
      }
      break
  }
}

/*
  There are 2 kinds of file, one is sole-purpose file (Domain Specific Fle), another one is mixed file (Code).
  1. sole-purpose file such as html, json, model, form. Like a simple program that only output
    one type of data.
    - html -> html file [single top-level]
    - json -> json file
    - form -> valid json (file) based on schema
    - model -> json schema file [multiple top-level]

  2. mixed file such as html template (with codes in holes), full-blown module
    where a full-blown module consist of functions, also can import module inside them.
    Each function must returns something, all the way up to a main function of a program.
 */
export const changeFile = (conf) => {
  let { projectStore, fileStore, fmodelname = null, focus = false } = conf

  const $fileBody = "file-body"

  if (fileStore) {
    readable(projectStore, "_currentFileStore", fileStore)
    readable(fileStore, "_models", anchorsModels(projectStore))
    fileStore.structSheet = projectStore.structSheet
    fileStore.entryable = projectStore.entryable

    switch (fileStore.t) {
      case MODEL_EXT:
        FmodelTree({ target: $fileBody, select: fmodelname, focus }, fileStore)
        SchMetaForm({ store: fileStore, target: "[id='fsch']", treeTarget: $fileBody })
        break
      case JSON_DATA_EXT:
        DataTree({ store: fileStore, target: $fileBody, select: fmodelname, focus })
        blankSchMetaForm("[id='fsch']")
        break
      case JSON_EXT:
        JSONTree({ target: $fileBody, select: fmodelname, focus }, fileStore)
        blankSchMetaForm("[id='fsch']")
        break
      case HTML_EXT:
        HTMLTree({ store: fileStore, target: $fileBody, select: fmodelname, focus })
        blankSchMetaForm("[id='fsch']")
        break
    }

    if (!window._treeClipboard) {
      let fmodelTree = document.querySelector(`${$fileBody} [role='tree']`)
      fmodelTree && fmodelTree._aria.clearClipboard(fmodelTree)
    }
  } else if (projectStore.fields.length == 0) {
    blankTree($fileBody)
    blankSchMetaForm("[id='fsch']")
  }
}

const unmarkEntriesExcept = (target, projectStore) => {
  // Only store the latest entrypoint, and delete all previous ones
  // We only allow one entry point for now
  if (target.dataset.tag == TOPLV_TAG) {
    walkFmodel(projectStore, (fmodel, m) => {
      if (fmodel.$a != target.sch.$a && fmodel.isEntry)
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
  addSch, addFile, addFolder, deleteSelected, submitEdit, paste,
  cloneUp, cloneDown, reorderUp, reorderDown,
  deleteSelected, markAsEntry
].map(cmd => cmd.name).includes(cmdname)
