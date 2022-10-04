import { Project } from "../main.js"
import { FileTree, renderFileNav, changeFile } from "../pkgs/file/index.js"
import { writable } from "../utils.js"

const { Store, Controller, Diff, Remote } = Project

export const handleTreeCommand = context => {
  let { e, ref } = context
  Controller.router(ref._store, e)
  handleRemotePush(context)
}

export const remoteConnected = ({ ref, imports, e }) => {
  let project = e.detail.project
  ref._store = Store.fromProject(project, { imports })
  ref._store.fields = JSON.parse(JSON.stringify(project.fields))
  Store.buildFolderTree(ref._store)

  FileTree({ target: "[id='project']", fileBody: "file-body", select: `[${project.currentFileId}]` }, ref._store)
  changeFile({ projectStore: ref._store, tree: { _passthrough: { fileBody: "file-body" } }, filename: project.currentFileId, fmodelname: location.hash.replace("#", "") })

  ref._base = JSON.parse(JSON.stringify(ref._store))
  Store.Indice.buildBaseIndices(ref._store)
  ref._base._indices = ref._store._indices
}

const handleRemotePush = context => {
  let { e, ref: { _store }, flags } = context

  if (!flags.diff) return
  let diffableActs = Object.values(_store.diffableActs).flat()
  if (!diffableActs.includes(e.detail.command.name))
    return

  pushToRemote(context)
}

const pushToRemote = context => {
  let { ref: { _store, _base } } = context

  diffRender(context)
  Remote.taggedDiff(_store, (diff) => {
    // simulute websocket push latency
    setTimeout(() => {
      for (let k of Object.keys(diff)) {
        diff[k].files = Object.values(diff[k].files)
        diff[k].fmodels = Object.values(diff[k].fmodels)
      }
      console.log(diff)
      Diff.mergeToBase(_base, diff)
      _base = JSON.parse(JSON.stringify(_store))
      Store.Indice.buildBaseIndices(_base)
      context = Object.assign(context, { _store, _base })
      diffRender(context)
    }, 0)
  })
}

const diffRender = ({ e, ref: { _store, _base } }) => {
  writable(_store, "_diffToRemote", Diff.diff(_store, _base))

  let fileStore = e.detail.target.closest("[data-tag='file']")?.sch
  if (fileStore && fileStore.render)
    fileStore.render()
  renderFileNav("[id='project']", _store)
}
