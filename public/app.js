/* This file is used for both development and test environments */
/* Please keep this file as library Call Site only */
/*
  <project-store> emulates production use case such as `Project.controller` so
  that we can integration test those edge of libaries.
*/

// Debug mode, import local files
// import { FileTree, Project } from "../lib/main.js"
// import * as Model from "../lib/pkgs/model/index.js"

// Preview mode, import bundled packages
import { FileTree, Project } from "fset"
import * as Model from "fset/pkgs/model.js"

import * as Diff from "../lib/sch/diff.js"
import { buffer } from "../lib/utils.js"

const structSheet = Object.assign({},
  Model.structSheet,
)

export const start = ({ project, diff = true, async = true }) =>
  customElements.define("project-store", class extends HTMLElement {
    connectedCallback() {
      this.remoteConnected()

      this.buffer = async ? buffer : f => f
      this.addEventListener("tree-command", this.buffer(this.handleTreeCommand.bind(this)))
      this.addEventListener("tree-command", this.buffer(this.handleRemotePush.bind(this), 0))
      this.addEventListener("sch-update", this.handleSchUpdate)
    }
    disconnectedCallback() {
      this.removeEventListener("tree-command", this.buffer(this.handleTreeCommand.bind(this)))
      this.removeEventListener("tree-command", this.buffer(this.handleRemotePush.bind(this), 0))
      this.removeEventListener("sch-update", this.handleSchUpdate)
    }
    handleTreeCommand(e) {
      Project.controller(this.projectStore, e.detail.target, e.detail.command)
    }
    handleRemotePush(e) {
      if (!diff) return
      if (!Project.isDiffableCmd(e.detail.command.name)) {
        // setTimeout(() => this.pushToRemote(e), 0)
        return
      }
      this.pushToRemote(e)
    }
    pushToRemote(e) {
      this.diffRender(e)
      Project.taggedDiff(this.projectStore, (diff) => {
        // simulute websocket push latency
        setTimeout(() => {
          Diff.mergeToBase(this.projectBaseStore, diff)
          // console.time("structureClone")
          // this.projectBaseStore = JSON.parse(JSON.stringify(this.projectStore))
          // Diff.buildBaseIndices(this.projectBaseStore)
          this.diffRender(e)
        }, 0)
      })
    }
    runDiff() {
      return Diff.diff(this.projectStore, this.projectBaseStore)
    }
    diffRender(e) {
      // writable(this.projectStore, "_diffToRemote", this.runDiff())

      let fileStore = e.detail.target.closest("[data-tag='file']")?.sch
      if (fileStore && fileStore.render)
        fileStore.render()
      this.projectStore.render()
    }
    handleSchUpdate(e) {
      let { detail } = e
      let fileStore = e.detail.target.closest("[data-tag='file']").sch
      if (fileStore)
        Project.SchMeta.update({ store: fileStore, detail })
    }
    remoteConnected() {
      this.projectStore = Project.projectToStore(project, { structSheet })
      this.projectStore.fields = project.fields
      project.fields = []
      this.projectStore.fields = this.projectStore.fields.map(file => file)
      Project.buildFolderTree(this.projectStore)

      FileTree(this.projectStore, { target: "[id='project']", select: `[${project.currentFileId}]` })
      Project.changeFile({ projectStore: this.projectStore, filename: project.currentFileId, fmodelname: location.hash.replace("#", "") })

      this.projectBaseStore = JSON.parse(JSON.stringify(this.projectStore))
      Diff.buildBaseIndices(this.projectBaseStore)
    }
  })
