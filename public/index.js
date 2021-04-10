import { FmodelTree, ProjectTree, SchMetaForm, Project } from "../lib/main.js"
import { project as projectFixture } from "./db_fixtures.js"
import * as Diff from "../lib/sch/diff.js"

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
    this.addEventListener("tree-command", buffer(this.handleProjectRemote.bind(this), 1000))
    this.addEventListener("sch-update", this.handleSchUpdate)
  }
  disconnectedCallback() {
    this.removeEventListener("tree-command", this.handleTreeCommand)
    this.removeEventListener("tree-command", buffer(this.handleProjectRemote.bind(this), 1000))
    this.removeEventListener("sch-update", this.handleSchUpdate)
  }
  handleTreeCommand(e) {
    Project.controller(projectStore, e.detail.target, e.detail.command, this.runDiff)
  }
  handleProjectRemote(e) {
    Project.taggedDiff(projectStore, e.detail.command, (diff) => {
      let file = e.detail.target.closest("[data-tag='file']")
      let filename = file?.key
      let fileStore = Project.getFileStore(projectStore, filename)

      projectBaseStore = JSON.parse(JSON.stringify(projectStore))
      this.runDiff()
      projectStore.render()
      fileStore.render()
    })
  }
  runDiff() {
    return Diff.diff(projectStore, projectBaseStore)
  }
  handleSchUpdate(e) {
    let { detail } = e
    let fileStore = Project.getFileStore(projectStore, e.detail.file)
    if (fileStore)
      Project.SchMeta.update({ store: fileStore, detail })
  }
})

addEventListener("DOMContentLoaded", e => {
  Project.projectToStore(project, projectStore)
  let current_file = project.files.find(f => f.id == project.current_file)
  let fileStore = Project.getFileStore(projectStore, current_file.key)

  fileStore._models = Project.anchorsModels(projectStore, fileStore)
  ProjectTree({ store: projectStore, target: "[id='project']" })
  FmodelTree({ store: fileStore, target: "[id='fmodel']" })
  SchMetaForm({ store: fileStore, target: "[id='fsch']", treeTarget: "[id='fmodel']" })

  projectBaseStore = JSON.parse(JSON.stringify(projectStore))
}, { once: true })
