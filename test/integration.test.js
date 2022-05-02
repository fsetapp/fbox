import { assert } from "@esm-bundle/chai";
import { Cmd, all, one, oneById, cleanup } from "./test_helper.js"
import { start } from "../public/app.js"
import { project } from "../lib/pkgs/proj.js"

var projectTree, fmodelTree
start({ project: project(), diff: false, async: false })

describe("projectTree actions by mouse or keyboard and rendering", () => {
  const projectTree_ = () => document.querySelector("[id='project'] [role='tree']")
  const fmodelTree_ = () => document.querySelector("file-body [role='tree']")

  beforeEach(() => {
    /* integration test expects all 3 elements to be present */
    document.body.innerHTML = `
      <project-store>
        <section id="project"></section>
        <file-body data-ext='fmodel'></file-body>
        <sch-meta id="fsch"></sch-meta>
      </project-store>
    `
    projectTree = projectTree_()
    fmodelTree = fmodelTree_()
  })

  it("renders blank project", () => {
    assert.isOk(projectTree)
    assert.equal(fmodelTree.outerHTML, `<ul role="tree"></ul>`)
  })

  it("adds files", () => {
    Cmd.addItem(projectTree)
    Cmd.addItem(projectTree)

    assert.equal(all(projectTree, { lv: 2 }).length, 2)
    assert.equal(document.activeElement, one(projectTree, { lv: 1, i: 1 }))
  })

  it("changes filename", () => {
    Cmd.addItem(projectTree)

    let file1 = one(projectTree, { lv: 2, i: 1 })
    Cmd.changekey(projectTree, file1.id, "file_1")
    assert.include(file1.textContent, "file_1")
    assert.equal(document.activeElement, file1)
  })

  it("deletes single file", () => {
    Cmd.addItem(projectTree)
    Cmd.addItem(projectTree)

    let newItem = one(projectTree, { lv: 2, i: 2 })
    assert.isOk(newItem)

    let removedId = newItem.id
    Cmd.click(projectTree, newItem.id)
    Cmd.remove(projectTree)

    assert.isNotOk(oneById(projectTree, removedId))
    assert.equal(document.activeElement, one(projectTree, { lv: 2, i: 1 }))
  })

  it("deletes multiple files", () => {
    Cmd.addItem(projectTree)
    Cmd.addItem(projectTree)

    let file_1 = one(projectTree, { lv: 2, i: 1 })
    let file_2 = one(projectTree, { lv: 2, i: 2 })
    assert.isOk(file_1)
    assert.isOk(file_2)

    Cmd.click(projectTree, file_1.id)
    Cmd.multiSelectDown(projectTree)
    Cmd.remove(projectTree)

    assert.isNotOk(oneById(projectTree, file_1.id))
    assert.isNotOk(oneById(projectTree, file_2.id))
    assert.equal(all(projectTree, { lv: 2 }).length, 0)
    assert.equal(document.activeElement, one(projectTree, { lv: 1, i: 1 }))
  })

  // it("clones file up, async reselect", () => {
  //   Cmd.addItem(projectTree)
  //   let item = one(projectTree, { lv: 2, i: 1 })

  //   Cmd.click(projectTree, item.id)
  //   Cmd.cloneUp(projectTree)
  //   assert.equal(item, one(projectTree, { lv: 2, i: 2 }))

  //   let clonedItem = one(projectTree, { lv: 2, i: 1 })
  //   assert.isOk(clonedItem)

  //   assert.isOk(document.activeElement)
  //   assert.equal(document.activeElement, clonedItem)
  // })


  // it("clones file down, async reselect", () => {
  //   Cmd.addItem(projectTree)
  //   let item = one(projectTree, { lv: 2, i: 1 })

  //   Cmd.click(projectTree, item.id)
  //   Cmd.cloneDown(projectTree)

  //   assert.equal(item, one(projectTree, { lv: 2, i: 1 }))
  //   let clonedItem = one(projectTree, { lv: 2, i: 2 })
  //   assert.isOk(clonedItem)

  //   assert.isOk(document.activeElement)
  //   assert.isOk(clonedItem)
  //   assert.equal(document.activeElement, clonedItem)
  // })

  // it("reorders file up", () => {
  //   Cmd.addItem(projectTree)
  //   Cmd.addItem(projectTree)
  //   let item = one(projectTree, { lv: 2, i: 2 })

  //   Cmd.click(projectTree, item.id)
  //   Cmd.moveUp(projectTree)
  //   let movedItem = one(projectTree, { lv: 2, i: 1 })
  //   assert.equal(item, movedItem)
  //   assert.isOk(one(projectTree, { lv: 2, i: 2 }))

  //   assert.isOk(document.activeElement)
  //   assert.equal(document.activeElement, movedItem)
  // })

  // it("does not reorders first file up", () => {
  //   Cmd.addItem(projectTree)
  //   Cmd.addItem(projectTree)
  //   let item = one(projectTree, { lv: 2, i: 1 })

  //   Cmd.click(projectTree, item.id)
  //   Cmd.moveUp(projectTree)

  //   let movedItem = one(projectTree, { lv: 2, i: 1 })
  //   assert.equal(item, movedItem)
  //   assert.isOk(one(projectTree, { lv: 2, i: 2 }))

  //   assert.isOk(document.activeElement)
  //   assert.equal(document.activeElement, movedItem)
  // })

  // it("reorders file down", () => {
  //   Cmd.addItem(projectTree)
  //   Cmd.addItem(projectTree)
  //   let item = one(projectTree, { lv: 2, i: 1 })

  //   Cmd.click(projectTree, item.id)
  //   Cmd.moveDown(projectTree)
  //   let movedItem = one(projectTree, { lv: 2, i: 2 })
  //   assert.equal(item, movedItem)
  //   assert.isOk(one(projectTree, { lv: 2, i: 1 }))

  //   assert.isOk(document.activeElement)
  //   assert.isOk(movedItem)
  //   assert.equal(document.activeElement, movedItem)
  // })

  // it("does not reorders last file down", () => {
  //   Cmd.addItem(projectTree)
  //   Cmd.addItem(projectTree)
  //   let item = one(projectTree, { lv: 2, i: 2 })

  //   Cmd.click(projectTree, item.id)
  //   Cmd.moveDown(projectTree)

  //   let movedItem = one(projectTree, { lv: 2, i: 2 })
  //   assert.equal(item, movedItem)
  //   assert.isOk(one(projectTree, { lv: 2, i: 1 }))

  //   assert.isOk(document.activeElement)
  //   assert.equal(document.activeElement, movedItem)
  // })

  it("cancels editting key", () => {
    Cmd.addItem(projectTree)
    let item = one(projectTree, { lv: 2, i: 1 })
    Cmd.click(projectTree, item.id)
    Cmd.enter(projectTree)

    let textarea = item.querySelector("textarea")
    assert.isOk(document.activeElement, textarea)

    Cmd.escape(textarea)
    assert.isOk(document.activeElement, item)
    assert.isNotOk(item.querySelector("textarea"))
  })
})

// It looks like `describe`(s) run parallel so we only use `it` here because
// we test the whole DOM, it seems to use the same `document` object.
//
describe("fmodelTree and projectTree: dependent rendering actions", () => {
  const projectTree_ = () => document.querySelector("[id='project'] [role='tree']")
  const fmodelTree_ = () => document.querySelector("file-body [role='tree']")

  beforeEach(() => {
    /* integration test expects all 3 elements to be present */
    document.body.innerHTML = `
      <project-store>
        <section id="project"></section>
        <file-body data-ext='fmodel'></file-body>
        <sch-meta id="fsch"></sch-meta>
      </project-store>
    `
    projectTree = projectTree_()
    fmodelTree = fmodelTree_()
  })
  it("moves an item from fmodelTree-A to fmodelTree-B via projectTree #paste, and move back", () => {
    // Add 2 files
    Cmd.addItem(projectTree)
    Cmd.addItem(projectTree)

    // at file 1
    Cmd.selectDown(projectTree)
    fmodelTree = fmodelTree_()

    // Add fmodel_A to a file
    Cmd.tab(projectTree)
    Cmd.addItem(fmodelTree)
    // Add fmodel_A field
    Cmd.selectDown(fmodelTree)
    Cmd.addItem(fmodelTree)

    assert.equal(one(projectTree, { lv: 2, i: 1 }).querySelector("[data-group-size]").dataset.groupSize, "1")
    assert.equal(one(projectTree, { lv: 2, i: 2 }).querySelector("[data-group-size]").dataset.groupSize, "0")

    // Cut fmodel_A from file 1 and paste to file 2
    Cmd.cut(fmodelTree)
    Cmd.tabBack(fmodelTree) // at file 1
    Cmd.selectDown(projectTree) // at file 2
    Cmd.paste(projectTree)

    assert.equal(one(projectTree, { lv: 2, i: 1 }).querySelector("[data-group-size]").dataset.groupSize, "0")
    assert.equal(one(projectTree, { lv: 2, i: 2 }).querySelector("[data-group-size]").dataset.groupSize, "1")
    assert.equal(document.activeElement, one(fmodelTree, { lv: 2, i: 1 }))

    // Cut fmodel_A from file 2 and paste back to file 1
    Cmd.cut(fmodelTree)
    Cmd.tabBack(fmodelTree) // at file 2
    Cmd.selectUp(projectTree) // at file 1
    Cmd.paste(projectTree)

    assert.equal(one(projectTree, { lv: 2, i: 1 }).querySelector("[data-group-size]").dataset.groupSize, "1")
    assert.equal(one(projectTree, { lv: 2, i: 2 }).querySelector("[data-group-size]").dataset.groupSize, "0")
    assert.equal(document.activeElement, one(fmodelTree, { lv: 2, i: 1 }))
    // console.log(fmodelTree)
    assert.isOk(one(fmodelTree, { lv: 3, i: 1 })) // Assumble a record with one field so we check level 3 instead of 2

    // assert the moved fmodel is gone
    Cmd.tabBack(fmodelTree) // at file 1
    Cmd.selectDown(projectTree) // at file 2
    assert.isNotOk(one(fmodelTree, { lv: 2, i: 1 }))
  })

  it("copy items from fmodelTree-A to fmodelTree-B via projectTree #paste", () => {
    // Add 2 files
    Cmd.addItem(projectTree)
    Cmd.addItem(projectTree)
    // at file 1
    Cmd.selectDown(projectTree)
    fmodelTree = fmodelTree_()

    // Add fmodel_A to a file
    Cmd.tab(projectTree)
    Cmd.addItem(fmodelTree)
    Cmd.addItem(fmodelTree)

    assert.equal(one(projectTree, { lv: 2, i: 1 }).querySelector("[data-group-size]").dataset.groupSize, "2")
    assert.equal(one(projectTree, { lv: 2, i: 2 }).querySelector("[data-group-size]").dataset.groupSize, "0")

    // Cut fmodel_A,B from file 1 and paste to file 2
    Cmd.selectDown(fmodelTree)
    Cmd.multiSelectDown(fmodelTree)
    Cmd.copy(fmodelTree)
    Cmd.tabBack(fmodelTree) // at file 1
    Cmd.selectDown(projectTree) // at file 2
    Cmd.paste(projectTree)

    assert.equal(one(projectTree, { lv: 2, i: 1 }).querySelector("[data-group-size]").dataset.groupSize, "2")
    assert.equal(one(projectTree, { lv: 2, i: 2 }).querySelector("[data-group-size]").dataset.groupSize, "2")
    assert.equal(document.activeElement, one(fmodelTree, { lv: 2, i: 2 }))
  })
})
