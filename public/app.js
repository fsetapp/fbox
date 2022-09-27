/* This file is used for both development and test environments */
/* Please keep this file as library Call Site only */
/*
  <project-store> emulates production use case such as `Project.router` so
  that we can integration test those edge of libaries.
*/

// Debug mode, import local files
import { Project } from "../lib/main.js"
import { FileTree, changeFile } from "../lib/pkgs/file/index.js"
import * as Model from "../lib/pkgs/model/index.js"
import * as Json from "../lib/pkgs/json/index.js"
import * as Html from "../lib/pkgs/html/index.js"
import * as Sheet from "../lib/pkgs/sheet/index.js"

const { Store, Controller, Diff, Remote } = Project

// Preview mode, import bundled packages
// import { FileTree, Project } from "fset"
// import * as Model from "fset/pkgs/model.js"
// import * as Json from "fset/pkgs/json.js"
// import * as Html from "fset/pkgs/html.js"

import { buffer, writable } from "../lib/utils.js"

const imports = [Model, Json, Html, Sheet]

export const start = ({ project, diff = true, async = true }) =>
  customElements.define("project-store", class extends HTMLElement {
    connectedCallback() {
      this.remoteConnected()

      this.buffer = async ? buffer : f => f
      this.addEventListener("tree-command", this)
      this.addEventListener("sch-update", this)
    }
    disconnectedCallback() {
      this.removeEventListener("tree-command", this)
      this.removeEventListener("sch-update", this)
    }
    handleEvent(e) {
      switch (e.type) {
        case "tree-command":
          this.buffer(() => this.handleTreeCommand(e))()
          this.buffer(() => this.handleRemotePush(e), 1000)()
          break
        case "sch-update":
          this.handleSchUpdate(e)
      }
    }
    handleTreeCommand(e) {
      Controller.router(this.projectStore, e)
    }
    handleRemotePush(e) {
      if (!diff) return
      let diffableActs = Object.values(this.projectStore.diffableActs).flat()
      if (!diffableActs.includes(e.detail.command.name))
        return

      this.pushToRemote(e)
    }
    pushToRemote(e) {
      this.diffRender(e)
      Remote.taggedDiff(this.projectStore, (diff) => {
        // simulute websocket push latency
        setTimeout(() => {
          for (let k of Object.keys(diff)) {
            diff[k].files = Object.values(diff[k].files)
            diff[k].fmodels = Object.values(diff[k].fmodels)
          }
          console.log(diff)
          Diff.mergeToBase(this.projectBaseStore, diff)
          this.projectBaseStore = JSON.parse(JSON.stringify(this.projectStore))
          Store.Indice.buildBaseIndices(this.projectBaseStore)
          this.diffRender(e)
        }, 0)
      })
    }
    runDiff() {
      return Diff.diff(this.projectStore, this.projectBaseStore)
    }
    diffRender(e) {
      writable(this.projectStore, "_diffToRemote", this.runDiff())

      let fileStore = e.detail.target.closest("[data-tag='file']")?.sch
      if (fileStore && fileStore.render)
        fileStore.render()
      this.projectStore.render()
    }
    handleSchUpdate(e) {
    }
    remoteConnected() {
      this.projectStore = Store.fromProject(project, { imports })
      this.projectStore.fields = project.fields
      Store.buildFolderTree(this.projectStore)

      FileTree({ target: "[id='project']", fileBody: "file-body", select: `[${project.currentFileId}]` }, this.projectStore)
      changeFile({ projectStore: this.projectStore, tree: { _passthrough: { fileBody: "file-body" } }, filename: project.currentFileId, fmodelname: location.hash.replace("#", "") })

      this.projectBaseStore = JSON.parse(JSON.stringify(this.projectStore))
      Store.Indice.buildBaseIndices(this.projectStore)
      this.projectBaseStore._indices = this.projectStore._indices
    }
  })
