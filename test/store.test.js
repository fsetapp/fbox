import { assert } from "@esm-bundle/chai";
import { initStore } from "./test_helper.js";
import { putAnchor } from "../lib/pkgs/core.js";
import { buildFolderTree } from "../lib/repo/store.js"
import { copy } from "../lib/sch.js"
import * as P from "../lib/pkgs/proj.js"
import * as M from "../lib/pkgs/model.js"

describe("store", () => {
  var store
  beforeEach(() => {
    store = initStore(P.project)
  })
  it("#buildFolderTree from empty folder", () => {
    const folder_a = { ...putAnchor(P.folder), key: "a" }
    const folder_a1 = { ...putAnchor(P.folder), key: "a1" }
    const folder_a_keep = folder_a.fields.splice(0, 1)[0]
    const folder_a1_keep = folder_a1.fields.splice(0, 1)[0]

    store.fields = [
      {
        ...folder_a_keep,
        lpath: [folder_a]
      },
      {
        ...folder_a1_keep,
        lpath: [folder_a, folder_a1]
      },
    ]
    buildFolderTree(store)
    const folderA = store.fields[0]
    const folderA1 = folderA.fields[1]

    assert.equal(store.fields.length, 1)
    assert.equal(folderA.$a, folder_a.$a)
    assert.equal(folderA.fields.length, 2)
    assert.equal(folderA.fields[0].$a, folder_a_keep.$a)
    assert.equal(folderA1.$a, folder_a1.$a)
    assert.equal(folderA1.fields.length, 1)
    assert.equal(folderA1.fields[0].$a, folder_a1_keep.$a)
  })

  it("#buildFolderTree with file that contains toplv", () => {
    const folder_a = putAnchor(() => P.folder({ key: "a" }))
    const modelFile1 = putAnchor(() => P.modelFile({ key: "model_file_1" }))
    const modelFile2 = putAnchor(() => P.modelFile({ key: "model_file_2" }))
    const modelFile3 = putAnchor(() => P.modelFile({ key: "model_file_3" }))
    const fmodel_a = putAnchor(M.record)
    const folder_a_keep = folder_a.fields.splice(0, 1)[0]
    // fields inside lpath should not happen, this is a fixture for writing defensive code
    folder_a.fields.push(...[folder_a_keep, modelFile1, modelFile2, modelFile3])

    store.fields = [
      {
        ...folder_a_keep,
        lpath: [copy(folder_a)]
      },
      {
        ...modelFile1,
        fields: [fmodel_a],
        lpath: [copy(folder_a)]
      },
      {
        ...modelFile2,
        fields: [],
        lpath: [copy(folder_a)]
      },
      {
        ...modelFile3,
        fields: [],
        lpath: [copy(folder_a)]
      },
    ]
    buildFolderTree(store)
    const folderA = store.fields[0]

    assert.equal(store.fields.length, 1)
    assert.equal(folderA.$a, folder_a.$a)
    assert.deepEqual(folderA.fields.length, 4)
    assert.deepEqual(folderA.fields[0], folder_a_keep)
    assert.deepEqual(folderA.fields[1].fields[0], fmodel_a)
  })
})
