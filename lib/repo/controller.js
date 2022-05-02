import * as A from "../actions.js"
const S = A.Selects

import { anchorsModels } from "../repo/store/indice.js"
import { walkFmodel } from "../repo/walk.js"

import { TOPLV_TAG } from "../pkgs/core.js"
import { FILE_TAG, JSON_DATA_EXT, MODEL_EXT, HTML_EXT, JSON_EXT } from "../pkgs/proj.js"

import { save as saveSchMeta } from "../sch/meta.js"
import { update as updateSch } from "../sch.js"
import { FmodelTree } from "../elements/fmodel_tree.js"
import { blankTree } from "../views/blank_view.js"
import { SchMetaForm, blankSchMetaForm } from "../elements/model_meta.js"
import { DataTree } from "../elements/data_tree.js"
import { HTMLTree } from "../elements/html_tree.js"
import { JSONTree } from "../elements/json_tree.js"

import { readable } from "../utils.js"

export const router = (projectStore, target, command, runDiff) => {
  const route = (tree) => !!target.closest(tree)

  switch (true) {
    case route("[id='project']"):
      projectController(projectStore, target, command, runDiff)
      break
    case route("[data-ext='fmodel']"):
      fmodelController(projectStore, target, command, runDiff)
      break
    case route("[data-ext='data']"):
      dataController(projectStore, target, command, runDiff)
      break
  }
}

const projectController = (projectStore, target, command, runDiff) => {
  // Keep in mind before this function is called project already renders once.
  switch (command) {
    case A.activateEditKey:
    case A.reorderUp:
    case A.reorderDown:
    case S.selectMultiNodeUpTo:
    case S.selectMultiNodeDownTo:
    case S.selectMultiNodeUp:
    case S.selectMultiNodeDown:
    case S.selectRoot:
      break
    case A.addSch:
    case A.addFile:
    case A.deleteSelected:
    case A.cloneUp:
    case A.cloneDown:
    case A.submitEdit:
    case A.clickSelect:
    case S.selectUpEnd:
    case S.selectDownEnd:
    case S.selectUp:
    case S.selectDown:
    case S.selectLast:
      let fileStore = target.closest("[data-tag='file']")?.sch
      changeFile({ projectStore, fileStore })
      break
    // `paste` currently already select fmodelTree (dst)
    case A.paste:
      projectStore.render()
      break
  }
}

const fmodelController = (projectStore, target, command, runDiff) => {
  switch (command) {
    case S.selectRoot:
    case S.selectMultiNodeUpTo:
    case S.selectMultiNodeDownTo:
    case S.selectMultiNodeUp:
    case S.selectMultiNodeDown:
    case A.reorderUp:
    case A.reorderDown:
    case A.expandSelected:
    case A.collapseSelected:
    case A.escapeEdit:
    case A.activateEditKey:
    case A.activateEditType:
    case A.cut:
    case A.copy:
      return
  }

  let fileStore = target.closest("[data-tag='file']")?.sch

  switch (target.dataset.tag) {
    case FILE_TAG:
      switch (command) {
        case A.addSch:
        case A.deleteSelected:
        case A.paste:
          readable(fileStore, "_models", anchorsModels(projectStore))
          projectStore.render()
          break
      }
      break
    case TOPLV_TAG:
      switch (command) {
        case A.markAsEntry:
          unmarkEntriesExcept(target, projectStore)
          fileStore.render()
          break
        case A.deleteSelected:
          readable(fileStore, "_models", anchorsModels(projectStore))
          projectStore.render()
          break
        case A.cloneUp:
        case A.cloneDown:
          unmarkEntriesExcept(target, projectStore)
          readable(fileStore, "_models", anchorsModels(projectStore))
          fileStore.render()
          projectStore.render()
          break
        case A.submitEdit:
          readable(fileStore, "_models", anchorsModels(projectStore))
          fileStore.render()
      }
      break
  }

  fileStore.renderSchMeta()
}

const dataController = (projectStore, target, command, runDiff) => {
  switch (command) {
    case S.selectRoot:
    case S.selectMultiNodeUpTo:
    case S.selectMultiNodeDownTo:
    case S.selectMultiNodeUp:
    case S.selectMultiNodeDown:
    case A.reorderUp:
    case A.reorderDown:
    case A.expandSelected:
    case A.collapseSelected:
    case A.escapeEdit:
    case A.activateEditKey:
    case A.activateEditType:
    case A.cut:
    case A.copy:
      return
  }

  let fileStore = target.closest("[data-tag='file']")?.sch

  switch (target.dataset.tag) {
    case FILE_TAG:
      switch (command) {
        case A.addSch:
        case A.deleteSelected:
        case A.paste:
          readable(fileStore, "_models", anchorsModels(projectStore))
          projectStore.render()
          break
      }
      break
    case TOPLV_TAG:
      switch (command) {
        case A.markAsEntry:
          unmarkEntriesExcept(target, projectStore)
          fileStore.render()
          break
        case A.deleteSelected:
          readable(fileStore, "_models", anchorsModels(projectStore))
          projectStore.render()
          break
        case A.cloneUp:
        case A.cloneDown:
          unmarkEntriesExcept(target, projectStore)
          readable(fileStore, "_models", anchorsModels(projectStore))
          fileStore.render()
          projectStore.render()
          break
        case A.submitEdit:
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
  A.addSch, A.addFile, A.addFolder, A.deleteSelected, A.submitEdit, A.paste,
  A.cloneUp, A.cloneDown, A.reorderUp, A.reorderDown,
  A.deleteSelected, A.markAsEntry
].map(cmd => cmd.name).includes(cmdname)
