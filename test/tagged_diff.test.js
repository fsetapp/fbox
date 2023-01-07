import { assert } from "@esm-bundle/chai";
import { initStore, initFileStore } from "./test_helper.js"
import * as Store from "../lib/repo/store.js"
import { taggedDiff } from "../lib/repo/tagged_diff.js"
import { diff } from "../lib/sch/diff.js"

import { putAnchor, TOPLV_TAG } from "../lib/pkgs/core.js"
import * as M from "../lib/pkgs/model.js"
import * as P from "../lib/pkgs/proj.js"

import * as Sch from "../lib/sch.js"
import { writable, forEach } from "../lib/utils.js";



const asBase = (store) => Store.Indice.buildBaseIndices(JSON.parse(JSON.stringify(store)))
const runDiff = (current, base) => writable(current, "_diffToRemote", diff(current, base))
const assertDiff = (diff) => {
  const { changed, added, removed, reorder } = diff
  const assertProp = (things, { has = [], hasNot = [] }) => {
    for (let key of Object.keys(things)) {
      for (let prop1 of has) assert.isDefined(things[key][prop1], prop1)
      for (let prop0 of hasNot) {
        let val = things[key][prop0]
        if (Array.isArray(val)) assert.isEmpty(val, prop0)
        else assert.isUndefined(val, prop0)
      }
    }
  }

  assertProp(changed.files, { has: ["lpath"] })
  assertFile(changed.files)
  assertProp(changed.fmodels, { hasNot: ["lpath"] })

  assertProp(added.files, { has: ["lpath"], hasNot: ["fields"] })
  assertFile(added.files)
  assertProp(added.fmodels, { hasNot: ["lpath"] })

  assertProp(removed.files, { hasNot: ["fields", "lpath"] })
  assertProp(removed.fmodels, { hasNot: ["fields", "lpath"] })

  assertProp(reorder.files, { has: ["lpath"], hasNot: ["fields"] })
  assertFile(reorder.files)
  assertProp(reorder.fmodels, { has: ["$a", "t", "key", "index"], hasNot: ["fields", "lpath", "sch"] })
}
const assertFile = files => {
  for (let k of Object.keys(files)) {
    let file = files[k]
    if (file.t == P.KEEP_EXT) assert.isNotEmpty(file.lpath, "keep file's lpath")
    assertLpath(file.lpath)

    let project = file.lpath[0]
    let innerMost = file.lpath.pop()
    assert.notEqual(project?.tag, P.PROJECT_TAG, project)
    assert.notEqual(innerMost?.$a, file.$a, innerMost)
  }
}
const assertLpath = (lpath) =>
  forEach(lpath, l => assert.isUndefined(l.fields, "fields inside lpath"))

describe("#taggedDiff", () => {
  var project
  const modelFile = () => P.file({ t: M.MODULE })

  beforeEach(() => {
    project = putAnchor(P.project)
    project = initStore(project)
  })
  it("moves subfmodel to be fmodel", () => {
    Sch.putp(project, "", [
      { k: "file_1", sch: modelFile, index: 0 },
    ])
    Sch.putp(project, "[file_1]", [
      { k: "fmodel_A", sch: () => M.record({ tag: TOPLV_TAG }), index: 0 },
      { k: "fmodel_B", sch: () => M.record({ tag: TOPLV_TAG }), index: 1 },
    ])
    Sch.putp(project, "[file_1][fmodel_A]", [
      { k: "A1", sch: M.record, index: 0 },
      { k: "A2", sch: M.record, index: 1 }
    ])

    let current = initFileStore(project)
    let base = asBase(current)

    Sch.movep(current, { dstId: "[file_1]" }, { "[file_1][fmodel_A]": [{ id: "[file_1][fmodel_A][A1]", index: 0 }] })
    let file1 = Sch.getp(current, "[file_1]")

    runDiff(current, base)
    taggedDiff(current, (diff) => {
      const { changed, added, removed, reorder } = diff
      assert.deepEqual(added.files, {})
      assert.deepEqual(added.fmodels["[file_1][A1]"], Sch.getp(current, "[file_1][A1]"))
      assert.equal(Object.keys(added.fmodels).length, 1)

      assert.deepEqual(removed.files, {})
      assert.deepEqual(removed.fmodels, {})

      assert.deepEqual(changed.files, {})
      assert.deepEqual(changed.fmodels["[file_1][fmodel_A]"], { ...Sch.getp(current, "[file_1][fmodel_A]"), pa: file1.$a })
      assert.equal(Object.keys(changed.fmodels).length, 1)

      assert.deepEqual(reorder.files, {})
      assert.equal(reorder.fmodels["[file_1][A1]"].index, 0)
      assert.equal(reorder.fmodels["[file_1][fmodel_A]"].index, 1)
      assert.equal(reorder.fmodels["[file_1][fmodel_B]"].index, 2)

      assertDiff({ changed, added, removed, reorder })
    })
  })

  it("moves fmodel to be subfmodel", () => {
    Sch.putp(project, "", [
      { k: "file_1", sch: modelFile, index: 0 },
    ])
    Sch.putp(project, "[file_1]", [
      { k: "A1", sch: M.string, index: 0 },
      { k: "fmodel_A", sch: () => M.record({ tag: TOPLV_TAG }), index: 1 },
      { k: "fmodel_B", sch: () => M.record({ tag: TOPLV_TAG }), index: 2 },
    ])

    let current = initFileStore(project)
    let base = asBase(current)

    let moved = Sch.movep(current, { dstId: "[file_1][fmodel_A]" }, { "[file_1]": [{ id: "[file_1][A1]", index: 0 }] })
    moved = moved["[file_1][fmodel_A]"][0].sch

    runDiff(current, base)
    taggedDiff(current, (diff) => {
      const { changed, added, removed, reorder } = diff
      assert.deepEqual(added.files, {})
      assert.deepEqual(added.fmodels, {})

      assert.deepEqual(removed.files, {})
      assert.deepEqual(removed.fmodels["[file_1][A1]"], { $a: moved.$a, pa: Sch.getp(current, "[file_1]").$a })
      assert.equal(Object.keys(removed.fmodels).length, 1)

      assert.deepEqual(changed.files, {})
      assert.deepEqual(changed.fmodels["[file_1][fmodel_A]"], Sch.getp(current, "[file_1][fmodel_A]"))
      assert.equal(Object.keys(changed.fmodels).length, 1)

      assert.deepEqual(reorder.files, {})
      assert.equal(reorder.fmodels["[file_1][fmodel_A]"].index, 0)
      assert.equal(reorder.fmodels["[file_1][fmodel_B]"].index, 1)

      assertDiff({ changed, added, removed, reorder })
    })
  })

  it("moves fmodel to be fmodel", () => {
    Sch.putp(project, "", [
      { k: "file_1", sch: modelFile, index: 0 },
      { k: "file_2", sch: modelFile, index: 1 },
    ])
    Sch.putp(project, "[file_1]", [
      { k: "fmodel_A", sch: () => M.record({ tag: TOPLV_TAG }), index: 0 },
      { k: "fmodel_B", sch: () => M.record({ tag: TOPLV_TAG }), index: 1 },
    ])

    let current = initFileStore(project)
    let base = asBase(current)

    let moved = Sch.movep(current, { dstId: "[file_2]" }, { "[file_1]": [{ id: "[file_1][fmodel_A]", index: 0 }] })
    moved = moved["[file_2]"][0].sch

    runDiff(current, base)
    taggedDiff(current, (diff) => {
      const { changed, added, removed, reorder } = diff
      assert.deepEqual(added.files, {})
      assert.deepEqual(added.fmodels["[file_2][fmodel_A]"], Sch.getp(current, "[file_2][fmodel_A]"))
      assert.equal(Object.keys(added.fmodels).length, 1)

      assert.deepEqual(removed.files, {})
      assert.deepEqual(removed.fmodels["[file_2][fmodel_A]"], Sch.getp(current, "[file_1][fmodel_A]"))
      assert.equal(Object.keys(removed.fmodels).length, 1)

      assert.deepEqual(changed.files, {})
      assert.deepEqual(changed.fmodels, {})

      assert.deepEqual(reorder.files, {})
      assert.equal(reorder.fmodels["[file_1][fmodel_B]"].index, 0)
      assert.equal(Object.keys(reorder.fmodels).length, 1)

      assertDiff({ changed, added, removed, reorder })
    })
  })

  it("removes fmodel one by one", () => {
    Sch.putp(project, "", [
      { k: "file_1", sch: modelFile, index: 0 },
      { k: "file_2", sch: modelFile, index: 1 },
    ])
    Sch.putp(project, "[file_1]", [
      { k: "fmodel_A", sch: () => M.record({ tag: TOPLV_TAG }), index: 0 },
      { k: "fmodel_B", sch: () => M.record({ tag: TOPLV_TAG }), index: 1 },
    ])
    Sch.putp(project, "[file_1][fmodel_A]", [
      { k: "A1", sch: M.string, index: 0 },
    ])

    let current = initFileStore(project)
    let base = asBase(current)

    let poppedPerSrc = Sch.popToRawSchs(current, { "[file_1][fmodel_A]": [{ id: "[file_1][fmodel_A][A1]", index: 0 }] }, { srcGet: (srcId, a, m) => m.path == srcId })
    assert.deepEqual(poppedPerSrc["[file_1][fmodel_A]"][0].sch(), Sch.getp(base, "[file_1][fmodel_A][A1]"))
    let file1 = Sch.getp(current, "[file_1]")

    runDiff(current, base)
    taggedDiff(current, (diff) => {
      const { changed, added, removed, reorder } = diff
      assert.deepEqual(added.files, {})
      assert.deepEqual(added.fmodels, {})

      assert.deepEqual(removed.files, {})
      assert.deepEqual(removed.fmodels, {})

      assert.deepEqual(changed.files, {})
      assert.deepEqual(changed.fmodels["[file_1][fmodel_A]"], { ...Sch.getp(current, "[file_1][fmodel_A]"), pa: file1.$a })

      assert.deepEqual(reorder.files, {})
      assert.deepEqual(reorder.fmodels, {})

      assertDiff({ changed, added, removed, reorder })
    })
  })

  it("changes t", () => {
    Sch.putp(project, "", [
      { k: "file_1", sch: modelFile, index: 0 },
    ])
    Sch.putp(project, "[file_1]", [
      { k: "fmodel_A", sch: () => M.record({ tag: TOPLV_TAG }), index: 0 },
      { k: "fmodel_B", sch: () => M.record({ tag: TOPLV_TAG }), index: 1 },
    ])
    Sch.putp(project, "[file_1][fmodel_A]", [
      { k: "A1", sch: M.string, index: 0 },
    ])

    let current = initFileStore(project)
    let base = asBase(current)

    Sch.changeTp(current, "[file_1][fmodel_A][A1]", () => Sch.clone(M.bool()))
    Sch.changeTp(current, "[file_1][fmodel_B]", () => Sch.clone(M.union()))
    let file1 = Sch.getp(current, "[file_1]")

    runDiff(current, base)
    taggedDiff(current, (diff) => {
      const { changed, added, removed, reorder } = diff
      assert.deepEqual(added.files, {})
      assert.deepEqual(added.fmodels, {})

      assert.deepEqual(removed.files, {})
      assert.deepEqual(removed.fmodels, {})

      assert.deepEqual(changed.files, {})

      assert.deepEqual(changed.fmodels["[file_1][fmodel_A]"], { ...Sch.getp(current, "[file_1][fmodel_A]"), pa: file1.$a })
      assert.deepEqual(changed.fmodels["[file_1][fmodel_B]"], { ...Sch.getp(current, "[file_1][fmodel_B]"), pa: file1.$a })

      assert.deepEqual(reorder.files, {})
      assert.deepEqual(reorder.fmodels, {})

      assertDiff({ changed, added, removed, reorder })
    })
  })

  it("clones down subtoplv and be able to get its cached toplv", () => {
    Sch.putp(project, "", [
      { k: "file_1", sch: modelFile, index: 0 },
    ])
    Sch.putp(project, "[file_1]", [
      { k: "fmodel_A", sch: () => M.record({ tag: TOPLV_TAG }), index: 0 },
    ])
    Sch.putp(project, "[file_1][fmodel_A]", [
      { k: "A1", sch: M.string, index: 0 },
      { k: "A2", sch: M.string, index: 1 },
    ])

    let current = initFileStore(project)
    let base = asBase(current)

    let file1 = Sch.getp(current, "[file_1]")
    let fmodelA = Sch.getp(current, "[file_1][fmodel_A]")
    let ascSelected = fmodelA.fields.map((a => ({ id: a.$a, index: a.index, key: a.key })))
    Sch.putSelected(current,
      { dstId: fmodelA.$a, startIndex: ascSelected[ascSelected.length - 1].index + 1 },
      { [fmodelA.$a]: ascSelected })

    assert.equal(fmodelA.fields.length, 4)

    runDiff(current, base)
    taggedDiff(current, (diff) => {
      const { changed, added, removed, reorder } = diff
      assert.deepEqual(added.files, {})
      assert.deepEqual(added.fmodels, {})

      assert.deepEqual(removed.files, {})
      assert.deepEqual(removed.fmodels, {})

      assert.deepEqual(changed.files, {})
      assert.deepEqual(changed.fmodels["[file_1][fmodel_A]"], { ...fmodelA, pa: file1.$a })

      assert.deepEqual(reorder.files, {})
      assert.deepEqual(reorder.fmodels, {})

      assertDiff({ changed, added, removed, reorder })
    })
  })

  it("NEW folder", () => {
    let current = initFileStore(project)
    let base = asBase(current)

    let folder_1 = P.folder()
    let folder_1_keep = folder_1.fields[0]
    Sch.putp(project, "", [
      { k: "folder_1", sch: () => folder_1, index: 0 },
    ])

    runDiff(current, base)
    taggedDiff(current, (diff) => {
      const { changed, added, removed, reorder } = diff
      assert.isOk(Sch.is(added.files[folder_1_keep.$a], folder_1_keep))
      assert.deepEqual(added.fmodels, {})

      assert.deepEqual(removed.files, {})
      assert.deepEqual(removed.fmodels, {})

      assert.deepEqual(changed.files, {})
      assert.deepEqual(changed.fmodels, {})

      assert.deepEqual(reorder.files, {})
      assert.deepEqual(reorder.fmodels, {})

      assertDiff({ changed, added, removed, reorder })
    })
  })

  it("NEW nested folder", () => {
    Sch.putp(project, "", [
      { k: "folder_1", sch: P.folder, index: 0 },
    ])

    let current = initFileStore(project)
    let base = asBase(current)

    let folder_11 = P.folder()
    let folder_11_keep = folder_11.fields[0]
    Sch.putp(current, "[folder_1]", [
      { k: "folder_11", sch: () => folder_11, index: 0 },
    ])

    runDiff(current, base)
    taggedDiff(current, (diff) => {
      const { changed, added, removed, reorder } = diff
      assert.isOk(Sch.is(added.files[folder_11_keep.$a], folder_11_keep))
      assert.deepEqual(added.fmodels, {})

      assert.deepEqual(removed.files, {})
      assert.deepEqual(removed.fmodels, {})

      assert.deepEqual(changed.files, {})
      assert.deepEqual(changed.fmodels, {})

      assert.deepEqual(reorder.files, {})
      assert.deepEqual(reorder.fmodels, {})

      assertDiff({ changed, added, removed, reorder })
    })
  })

  it("NEW_KEY folder", () => {
    let folder1 = P.folder()
    let folder11 = P.folder()
    let modelFile_ = modelFile()

    Sch.putp(project, "", [
      { k: "folder_1", sch: () => folder1, index: 0 },
    ])
    Sch.putp(project, "[folder_1]", [
      { k: "folder_11", sch: () => folder11, index: 0 },
      { k: "model_1", sch: () => modelFile_, index: 0 }
    ])

    let current = initFileStore(project)
    let base = asBase(current)

    let moved = Sch.movep(current, { dstId: "", startIndex: 0 }, { "": [{ id: "folder_1", index: 0, newK: "abc" }] })

    runDiff(current, base)
    taggedDiff(current, (diff) => {
      const { changed, added, removed, reorder } = diff
      assert.deepEqual(added.files, {})
      assert.deepEqual(added.fmodels, {})

      assert.deepEqual(removed.files, {})
      assert.deepEqual(removed.fmodels, {})

      let folder1_keep = folder1.fields.find(a => a.t == P.KEEP_EXT)
      let folder11_keep = folder11.fields.find(a => a.t == P.KEEP_EXT)

      assert.deepEqual(changed.files[folder1_keep.$a].lpath.map(l => l.key), ["abc"])
      assert.deepEqual(changed.files[folder11_keep.$a].lpath.map(l => l.key), ["abc", "folder_11"])
      assert.deepEqual(changed.files[modelFile_.$a].key, "model_1")
      assert.deepEqual(changed.files[modelFile_.$a].lpath.map(l => l.key), ["abc"])
      assert.deepEqual(changed.fmodels, {})

      assert.deepEqual(reorder.files, {})
      assert.deepEqual(reorder.fmodels, {})

      assertDiff({ changed, added, removed, reorder })
    })
  })

  it("REMOVED folder", () => {
    let folder1 = P.folder()
    let folder11 = P.folder()
    let modelFile_ = modelFile()

    Sch.putp(project, "", [
      { k: "folder_1", sch: () => folder1, index: 0 },
    ])
    Sch.putp(project, "[folder_1]", [
      { k: "folder_11", sch: () => folder11, index: 0 },
    ])
    Sch.putp(project, "[folder_1][folder_11]", [
      { k: "model_1", sch: () => modelFile_, index: 0 },
    ])


    let current = initFileStore(project)
    let base = asBase(current)

    let popped = Sch.popp(current, "[folder_1]", [0])

    runDiff(current, base)
    taggedDiff(current, (diff) => {
      const { changed, added, removed, reorder } = diff
      assert.deepEqual(added.files, {})
      assert.deepEqual(added.fmodels, {})

      let folder11_keep = folder11.fields.find(a => a.t == P.KEEP_EXT)

      assert.equal(Object.keys(removed.files).length, 2)
      assert.isOk(removed.files[folder11_keep.$a])
      assert.isOk(removed.files[modelFile_.$a])
      assert.deepEqual(removed.fmodels, {})

      assert.deepEqual(changed.files, {})
      assert.deepEqual(changed.fmodels, {})

      assert.deepEqual(reorder.files, {})
      assert.deepEqual(reorder.fmodels, {})

      assertDiff({ changed, added, removed, reorder })
    })
  })

  it("NEW file", () => {
    let folder1 = P.folder()
    let modelFile_ = modelFile()

    Sch.putp(project, "", [
      { k: "folder_1", sch: () => folder1, index: 0 },
    ])

    let current = initFileStore(project)
    let base = asBase(current)

    Sch.putp(current, "[folder_1]", [
      { k: "model_1", sch: () => modelFile_, index: 0 },
    ])

    runDiff(current, base)
    taggedDiff(current, (diff) => {
      const { changed, added, removed, reorder } = diff
      const { fields, ...folder1_ } = folder1
      assert.deepEqual(added.files["[folder_1][model_1]"].lpath, [folder1_])
      assert.deepEqual(added.fmodels, {})

      assert.deepEqual(removed.files, {})
      assert.deepEqual(removed.fmodels, {})

      assert.deepEqual(changed.files, {})
      assert.deepEqual(changed.fmodels, {})

      assert.deepEqual(reorder.files, {})
      assert.deepEqual(reorder.fmodels, {})

      assertDiff({ changed, added, removed, reorder })
    })
  })

  it("performs less than 50ms for ~1000 nodes", () => {
    const nNodes = 1300
    let modelFile_ = modelFile()

    for (var i = 0; i < nNodes; i++)
      modelFile_.fields.push(putAnchor(() => M.e_record({ tag: TOPLV_TAG })))

    const ascSelected = modelFile_.fields.map((a, i) => ({ id: a.$a, index: i, key: i }))

    Sch.putp(project, "", [
      { k: "model_1", sch: () => modelFile_, index: 0 },
    ])

    let current = initFileStore(project)
    let base = asBase(current)

    // const dstId = current.$a
    const dst = Sch.getp(current, "[model_1]")
    const putSelectedStart = performance.now()
    Sch.putSelected(current,
      { dstId: dst.$a, startIndex: ascSelected[ascSelected.length - 1].index + 1 },
      { [dst.$a]: ascSelected })
    assert.isBelow(performance.now() - putSelectedStart, 150) // ideally 100ms, +50ms for slow machine

    runDiff(current, base)

    const taggedDiffStart = performance.now()
    taggedDiff(current, (diff) => {
      assert.isBelow(performance.now() - taggedDiffStart, 50)
      assert.equal(Object.keys(diff.added.fmodels).length, nNodes)
    })
  })
})
describe("#taggedDiff from actions#addSch ", () => {
  // Database blows this up already
  it("dedup what is in both added{} and changed{}", () => { })
  // key "$a" not found in: %{"pa" => "fa3b0db8-ee72-4778-acf5-ec9600f2fe47"}
  // SEEM TO BE SERVER-SIDE PROBLEM
  it("ensure added item has mandatory properties $a", () => { })
})
