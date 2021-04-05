import { initModelView, initFileView, update, Project } from "../lib/main.js"
import { project as projectFixture } from "./db_fixtures.js"

"use strict"

var projectStore = Project.createProjectStore()
var project = projectFixture
var projectBaseStore

const buffer = function (func, wait, scope) {
  var timer = null;
  return function () {
    if (timer) clearTimeout(timer)
    var args = arguments
    timer = setTimeout(function () {
      timer = null
      func.apply(scope, args)
    }, wait)
  }
}
customElements.define("sch-listener", class extends HTMLElement {
  connectedCallback() {
    this.addEventListener("tree-command", this.handleTreeCommand)
    this.addEventListener("tree-command", buffer(this.handleProjectRemote, 1000))
    this.addEventListener("sch-update", this.handleSchUpdate)
  }
  disconnectedCallback() {
    this.removeEventListener("tree-command", this.handleTreeCommand)
    this.removeEventListener("tree-command", buffer(this.handleProjectRemote, 1000))
    this.removeEventListener("sch-update", this.handleSchUpdate)
  }
  handleTreeCommand(e) {
    Project.handleProjectContext(projectStore, e.detail.target, e.detail.command)
  }
  handleProjectRemote(e) {
    Project.handleProjectRemote(projectStore, projectBaseStore, e.detail.command, (diff) => {
      projectBaseStore = JSON.parse(JSON.stringify(projectStore))
    })
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

  projectBaseStore = JSON.parse(JSON.stringify(projectStore))
}, { once: true })
