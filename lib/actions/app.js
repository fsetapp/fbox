import { Project } from "../main.js"
import { FileTree, renderFileNav, changeFile } from "../pkgs/file/index.js"
import { writable } from "../utils.js"

const { Store, Controller, Diff, Remote } = Project

export const handleTreeCommand = context => {
  let { e, store } = context
  Controller.router(store, e)
  handleRemotePush(context)
}

export const remoteConnected = (context) => {
  const { imports, e } = context
  let project = e.detail.project

  context.store = Store.fromProject(project, { imports })
  let store = context.store

  store.fields = JSON.parse(JSON.stringify(project.fields))
  Store.buildFolderTree(store)

  FileTree({ target: "[id='project']", fileBody: "file-body", select: `[${project.currentFileId}]` }, store)
  changeFile({ projectStore: store, tree: { _passthrough: { fileBody: "file-body" } }, filename: project.currentFileId, fmodelname: location.hash.replace("#", "") })

  context.base = JSON.parse(JSON.stringify(store))
  Store.Indice.buildBaseIndices(store)
  context.base._indices = store._indices
}

const handleRemotePush = context => {
  let { e, store, flags } = context

  if (!flags.diff) return
  let diffableActs = Object.values(store.diffableActs).flat()
  if (!diffableActs.includes(e.detail.command.name))
    return

  pushToRemote(context)
}

const pushToRemote = context => {
  let { store, base } = context

  diffRender(context)
  Remote.taggedDiff(store, (diff) => {
    // simulute websocket push `channel.push("push_project", diff))` and get back saved diff`
    setTimeout(() => {
      for (let k of Object.keys(diff)) {
        diff[k].files = Object.values(diff[k].files).map(file => { file.fields ||= []; return file })
        diff[k].fmodels = Object.values(diff[k].fmodels)
      }
      console.log(diff)
      Diff.mergeToBase(base, diff)
      diffRender(context)
    }, 0)
  })
}

const diffRender = ({ e, store, base }) => {
  writable(store, "_diffToRemote", Diff.diff(store, base))

  let fileStore = e.detail.target.closest("[data-tag='file']")?.sch
  fileStore?._tree?._render?.(fileStore)
  renderFileNav("[id='project']", store)
}
