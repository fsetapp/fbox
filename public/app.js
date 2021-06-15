/* This file is used for both development and test environments */
/* Please keep this file as library Call Site only */
/*
  <sch-listener> emulates production use case such as `Project.controller` so
  that we can integration test those edge of libaries.
*/

import { ProjectTree, Project } from "../lib/main.js"
import * as Diff from "../lib/sch/diff.js"
import { buffer } from "../lib/utils.js"

export const start = ({ project, diff = true, async = true }) =>
  customElements.define("sch-listener", class extends HTMLElement {
    connectedCallback() {
      this.remoteConnected()

      this.buffer = async ? buffer : f => f
      this.addEventListener("tree-command", this.buffer(this.handleTreeCommand.bind(this)))
      this.addEventListener("tree-command", this.buffer(this.handleProjectRemote.bind(this), 1000))
      this.addEventListener("sch-update", this.handleSchUpdate)
    }
    disconnectedCallback() {
      this.removeEventListener("tree-command", this.buffer(this.handleTreeCommand.bind(this)))
      this.removeEventListener("tree-command", this.buffer(this.handleProjectRemote.bind(this), 1000))
      this.removeEventListener("sch-update", this.handleSchUpdate)
    }
    handleTreeCommand(e) {
      Project.controller(this.projectStore, e.detail.target, e.detail.command)
      // this.diffRender(e)
    }
    handleProjectRemote(e) {
      if (!diff) return
      if (!Project.isDiffableCmd(e.detail.command.name))
        return

      this.diffRender(e)
      Project.taggedDiff(this.projectStore, (diff) => {
        this.projectBaseStore = JSON.parse(JSON.stringify(this.projectStore))
        Diff.buildBaseIndices(this.projectBaseStore)
        // this.diffRender(e)
      })
    }
    runDiff() {
      return Diff.diff(this.projectStore, this.projectBaseStore)
    }
    diffRender(e) {
      Object.defineProperty(this.projectStore, "_diffToRemote", { value: this.runDiff(), writable: true })
      let file = e.detail.target.closest("[data-tag='file']")
      let filename = file?.key
      let fileStore = Project.getFileStore(this.projectStore, filename)
      fileStore?.render()
    }
    handleSchUpdate(e) {
      let { detail } = e
      let fileStore = Project.getFileStore(this.projectStore, e.detail.file)
      if (fileStore)
        Project.SchMeta.update({ store: fileStore, detail })
    }
    remoteConnected() {
      let files = project.fields
      project.fields = []
      this.projectStore = Project.projectToStore(project, Project.createProjectStore())
      for (let file of files) this.projectStore.fields.push(Project.fileToStore(file))

      ProjectTree({ store: this.projectStore, target: "[id='project']", select: `[${project.currentFileKey}]` })
      Project.changeFile(this.projectStore, project.currentFileKey, location.hash.replace("#", ""))

      this.projectBaseStore = JSON.parse(JSON.stringify(this.projectStore))
      Diff.buildBaseIndices(this.projectBaseStore)
    }
  })
