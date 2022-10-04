import * as A from "../actions.js"
import { readable } from "../utils.js"
import { anchorsModels } from "../repo/store/indice.js"
import { blankTree } from "../views/blank_view.js"
import { renderFileNav } from "../pkgs/file/index.js"

export { controller, changeFile }

const S = A.Selects

const renderFileNav_ = store => renderFileNav("[data-ext='project']", store)

const controller = (projectStore, { tree, target, command }) => {
  // Keep in mind before this function is called after project already renders once.
  switch (command) {
    // case A.activateEditKey:
    // case A.reorderUp:
    // case A.reorderDown:
    // case S.selectMultiNodeUpTo:
    // case S.selectMultiNodeDownTo:
    // case S.selectMultiNodeUp:
    // case S.selectMultiNodeDown:
    // case S.selectRoot:
    //   break
    case A.addSch:
    case A.addFile:
    case A.deleteSelected:
    case A.cloneUp:
    case A.cloneDown:
    case A.submitEdit:
    case S.clickSelect:
    case S.selectUpEnd:
    case S.selectDownEnd:
    case S.selectUp:
    case S.selectDown:
    case S.selectLast:
      let fileStore = target.closest("[data-tag='file']")?.sch
      changeFile({ projectStore, fileStore, tree })
      break
    // `paste` currently already select fmodelTree (dst)
    case A.paste:
      renderFileNav_(projectStore)
      break
  }
}

const changeFile = (conf) => {
  let { projectStore, fileStore, tree, fmodelname = null, focus = false } = conf
  const { fileBody } = tree._passthrough

  if (fileStore) {
    readable(projectStore, "_currentFileStore", fileStore)
    readable(fileStore, "_models", anchorsModels(projectStore))
    fileStore.structSheet = projectStore.structSheet
    fileStore.entryable = projectStore.entryable
    const { body } = projectStore.elements[fileStore.t]
    body({ target: fileBody, select: fmodelname, focus }, fileStore)

    if (!window._treeClipboard) {
      let fmodelTree = document.querySelector(`${fileBody} [role='tree']`)
      fmodelTree && fmodelTree._aria.clearClipboard(fmodelTree)
    }
  } else if (projectStore.fields.length == 0) {
    blankTree(fileBody)
  }
}
