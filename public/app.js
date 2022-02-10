/* This file is used for both development and test environments */
/* Please keep this file as library Call Site only */
/*
  <sch-listener> emulates production use case such as `Project.controller` so
  that we can integration test those edge of libaries.
*/

import { ProjectTree, FileTree, Project } from "../lib/main.js"
import * as Diff from "../lib/sch/diff.js"
import { buffer, writable } from "../lib/utils.js"

export const start = ({ project, diff = true, async = true }) =>
  customElements.define("sch-listener", class extends HTMLElement {
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
          // Diff.mergeToBase(this.projectBaseStore, diff)
          this.projectBaseStore = JSON.parse(JSON.stringify(this.projectStore))
          Diff.buildBaseIndices(this.projectBaseStore)
          this.diffRender(e)
        }, 0)
      })
    }
    runDiff() {
      return Diff.diff(this.projectStore, this.projectBaseStore)
    }
    diffRender(e) {
      writable(this.projectStore, "_diffToRemote", this.runDiff())

      let file = e.detail.target.closest("[data-tag='file']")
      let filename = file?.key
      let fileStore = Project.getFileStore(this.projectStore, filename)
      fileStore?.render()
      this.projectStore.render()
    }
    handleSchUpdate(e) {
      let { detail } = e
      let fileStore = Project.getFileStore(this.projectStore, e.detail.file)
      if (fileStore)
        Project.SchMeta.update({ store: fileStore, detail })
    }
    remoteConnected() {
      this.projectStore = Project.projectToStore(project, Project.createProjectStore())
      this.projectStore.fields = project.fields
      project.fields = []
      this.projectStore.fields = this.projectStore.fields.map(file => Project.fileToStore(file, null, this.projectStore))
      Project.buildFolderTree(this.projectStore)

      FileTree({ store: this.projectStore, target: "[id='project']", select: `[${project.currentFileKey}]` })
      Project.changeFile({ projectStore: this.projectStore, filename: project.currentFileKey, fmodelname: location.hash.replace("#", "") })

      this.projectBaseStore = JSON.parse(JSON.stringify(this.projectStore))
      Diff.buildBaseIndices(this.projectBaseStore)
    }
  })
