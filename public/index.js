import { initModelView, initFileView, update, Project } from "../lib/main.js"
import { project as projectFixture } from "./db_fixtures.js"

"use strict"

var projectStore = Project.createProjectStore()
var project = projectFixture

customElements.define("sch-listener", class extends HTMLElement {
  connectedCallback() {
    this.addEventListener("tree-command", this.handleTreeCommand)
    this.addEventListener("sch-update", this.handleSchUpdate)
  }
  disconnectedCallback() {
    this.removeEventListener("tree-command", this.handleTreeCommand)
    this.removeEventListener("sch-update", this.handleSchUpdate)
  }
  handleTreeCommand(e) {
    Project.handleProjectContext(projectStore, e.target, e.detail.file, e.detail.command)
  }
  handleSchUpdate(e) {
    let { detail, target } = e
    let fileStore = Project.getFileStore(projectStore, e.detail.file)
    if (fileStore)
      update({ store: fileStore, detail, target })
  }
})

addEventListener("DOMContentLoaded", e => {
  Project.projectToStore(project, projectStore)
  let current_file = project.files.find(f => f.id == project.current_file)
  let fileStore = Project.getFileStore(projectStore, current_file.key)

  fileStore._models = Project.anchorsModels(projectStore, fileStore)
  initFileView({ store: projectStore, target: "[id='project']" })
  initModelView({ store: fileStore, target: "[id='fmodel']", metaSelector: "sch-meta" })
}, { once: true })
