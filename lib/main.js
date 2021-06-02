// Elements are built on top of component (state + behaviour) and view, can also
// dispatch events (works great with Custom Element as controller)
export { FmodelTree, ProjectTree, SchMetaForm } from "./elements.js"

import { controller, SchMeta, isDiffableCmd, changeFile } from "./project/controller.js"
import { taggedDiff } from "./project/tagged_diff.js"
import { getFileStore, anchorsModels, projectToStore, createProjectStore, allSchs, rulesTable } from "./project/store.js"

export const Project = {
  createProjectStore, getFileStore, anchorsModels, projectToStore, controller,
  changeFile, taggedDiff, isDiffableCmd, SchMeta, allSchs, rulesTable
}

export * as Diff from "../lib/sch/diff.js"
export { toStr as tstr } from "../lib/sch/type.js"
