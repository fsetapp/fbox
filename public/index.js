import { initModelView, initFileView, update, createStore, allSchs } from "../lib/main.js"
import * as Sch from "../lib/sch.js"
import * as T from "../lib/sch/type.js"
import { randInt } from "../lib/utils.js"

"use strict"

const FILE_TAG = "file"
const PROJECT_TAG = "project"

var projectStore = createStore({ tag: PROJECT_TAG, allowedSchs: [() => createStore({ tag: FILE_TAG })], put: "append" })

const fmodelsFixture = (n, startId, opts) => {
  let fixture = []
  for (var i = 0; i < n; i++)
    fixture.push(allSchs[randInt(allSchs.length)])

  return fixture.map((sch, i) => {
    let fmodel = { id: startId + i, key: `model_${startId}_${fixture.length - i}`, sch: T.putAnchor(sch, T.FMODEL_BOX) }
    return Object.assign(fmodel, opts)
  })
}

let file_1_models = fmodelsFixture(10, 1, { file_id: 1 })
let file_1 = {
  id: 1,
  key: "file_1",
  project_id: 1,
  order: file_1_models.map(m => m.key),
  fmodels: file_1_models
}
let file_2_models = fmodelsFixture(1000, 11, { file_id: 2 })
let file_2 = {
  id: 2,
  key: "file_2",
  project_id: 1,
  order: file_2_models.map(m => m.key),
  fmodels: file_2_models
}
let file_3_models = fmodelsFixture(10, 21, { file_id: 3 })
let file_3 = {
  id: 3,
  key: "file_3",
  project_id: 1,
  order: file_3_models.map(m => m.key),
  fmodels: file_3_models
}
const project = {
  id: 1,
  key: "unclaimed_project",
  files: [file_1, file_2, file_3],
  order: ["file_1", "file_2", "file_3"],
  entry_points: [{ id: 1, key: "model_1" }],
  current_file: 1
}

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
    if (e.target.closest("[id='project']"))
      switch (true) {
        case ["selectUp", "selectDown", "clickSelect"].includes(e.detail.command.name):
          this.changeFile(projectStore, e.detail)
          break
        case ["addSch"].includes(e.detail.command.name):
          let fmodelTree = document.querySelector("[id='fmodel'] [role='tree']")
          fmodelTree._render()
      }
  }
  changeFile(projectStore, detail) {
    let fileStore = Sch.get(projectStore, `[${detail.file}]`) || projectStore
    fileStore.key = fileStore.key || detail.file

    if (fileStore?._box == FILE_TAG) {
      initModelView({ store: fileStore, target: "[id='fmodel']", metaSelector: "sch-meta" })
      return true
    }
    else
      return false
  }
  handleSchUpdate(e) {
    let { detail, target } = e
    let fileStore = Sch.get(projectStore, `[${e.detail.file}]`)
    if (fileStore)
      update({ store: fileStore, detail, target })
  }
})

const fileToStore = (file, store) => {
  for (let fmodel of file.fmodels) store.fields[fmodel.key] = fmodel.sch
  store.key = file.key
  store.order = file.order
  return T.putAnchor(() => store)
}
const projectToStore = (project, store) => {
  for (let file of project.files) store.fields[file.key] = fileToStore(file, createStore({ tag: FILE_TAG }))
  store.key = project.key
  store.order = project.order
  return T.putAnchor(() => store)
}

addEventListener("DOMContentLoaded", e => {
  projectToStore(project, projectStore)
  let current_file = project.files.find(f => f.id == project.current_file)
  let fileStore = Sch.get(projectStore, `[${current_file.key}]`)

  initFileView({ store: projectStore, target: "[id='project']" })
  initModelView({ store: fileStore, target: "[id='fmodel']", metaSelector: "sch-meta" })
}, { once: true })
