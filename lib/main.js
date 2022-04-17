// Elements are built on top of component (state + behaviour) and view, can also
// dispatch events (works great with Custom Element as controller)
import { ReadOnlyFmodelTree } from "./elements.js"
export { FmodelTree, ReadOnlyFmodelTree, FileTree, SchMetaForm } from "./elements.js"

import { controller, SchMeta, isDiffableCmd, changeFile } from "./project/controller.js"
import { taggedDiff } from "./project/tagged_diff.js"
import {
  getFileStore, anchorsModels, projectToStore, createProjectStore,
  mergeSchMetas, mergeReferrers, walkFile, buildFolderTree
} from "./project/store.js"

import { structSheet } from "./pkgs/model.js"

export { legitTs } from "./pkgs/core.js"
const { toStr } = structSheet
export { toStr as tstr }

export const Project = {
  createProjectStore, getFileStore, anchorsModels, projectToStore, controller, mergeSchMetas, mergeReferrers,
  changeFile, taggedDiff, isDiffableCmd, SchMeta, walkFile, buildFolderTree
}

export const View = { ReadOnlyFmodelTree }

export * as Diff from "../lib/sch/diff.js"
