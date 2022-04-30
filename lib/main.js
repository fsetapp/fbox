// Elements are built on top of component (state + behaviour) and view, can also
// dispatch events (works great with Custom Element as controller)
export { FmodelTree, ReadOnlyFmodelTree, FileTree, SchMetaForm } from "./elements.js"

import { controller, SchMeta, isDiffableCmd, changeFile } from "./project/controller.js"
import { taggedDiff } from "./project/tagged_diff.js"
import {
  getFileStore, anchorsModels, projectToStore,
  mergeSchMetas, mergeReferrers, walkFile, buildFolderTree
} from "./project/store.js"

// Temporary: will be removed once combobox is moved in this project
import { structSheet } from "./pkgs/model.js"
export { legitTs } from "./pkgs/core.js"
const { toStr } = structSheet
export { toStr as tstr }

export const Project = {
  getFileStore, anchorsModels, projectToStore, controller, mergeSchMetas, mergeReferrers,
  changeFile, taggedDiff, isDiffableCmd, SchMeta, walkFile, buildFolderTree
}

export * as Diff from "../lib/sch/diff.js"
