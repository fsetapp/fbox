import { Project } from "../main.js"
import { FileTree, changeFile } from "../pkgs/file/index.js"
import { writable } from "../utils.js"

const { Store, Controller, Diff, Remote } = Project

export const handleTreeCommand = context => {
  let { e, projectStore } = context
  Controller.router(projectStore, e)
  handleRemotePush(context)
}

export const remoteConnected = ({ imports, project }) => {
  let projectStore = Store.fromProject(project, { imports })
  projectStore.fields = project.fields
  Store.buildFolderTree(projectStore)

  FileTree({ target: "[id='project']", fileBody: "file-body", select: `[${project.currentFileId}]` }, projectStore)
  changeFile({ projectStore: projectStore, tree: { _passthrough: { fileBody: "file-body" } }, filename: project.currentFileId, fmodelname: location.hash.replace("#", "") })

  let projectBaseStore = JSON.parse(JSON.stringify(projectStore))
  Store.Indice.buildBaseIndices(projectStore)
  projectBaseStore._indices = projectStore._indices

  return { projectStore, projectBaseStore }
}

const handleRemotePush = context => {
  let { e, projectStore, flags } = context

  if (!flags.diff) return
  let diffableActs = Object.values(projectStore.diffableActs).flat()
  if (!diffableActs.includes(e.detail.command.name))
    return

  pushToRemote(context)
}

const pushToRemote = context => {
  let { projectStore, projectBaseStore } = context

  diffRender(context)
  Remote.taggedDiff(projectStore, (diff) => {
    // simulute websocket push latency
    setTimeout(() => {
      for (let k of Object.keys(diff)) {
        diff[k].files = Object.values(diff[k].files)
        diff[k].fmodels = Object.values(diff[k].fmodels)
      }
      console.log(diff)
      Diff.mergeToBase(projectBaseStore, diff)
      projectBaseStore = JSON.parse(JSON.stringify(projectStore))
      Store.Indice.buildBaseIndices(projectBaseStore)
      diffRender(context)
    }, 0)
  })
}

const diffRender = ({ e, projectStore, projectBaseStore }) => {
  writable(projectStore, "_diffToRemote", Diff.diff(projectStore, projectBaseStore))

  let fileStore = e.detail.target.closest("[data-tag='file']")?.sch
  if (fileStore && fileStore.render)
    fileStore.render()
  projectStore.render()
}
