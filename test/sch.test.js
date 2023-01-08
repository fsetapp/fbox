import { assert } from "@esm-bundle/chai";
import { getp, updatep, putp, popp, movep, changeTp, onlyMostOuters } from "../lib/sch.js"
import M, * as Model from "../lib/pkgs/model.js"
// Does it necessary needs registry? Seems like a coupling.
import { s } from "../lib/pkgs/registry.js"
// So every store seems to need the registry (skip module import, treat them as global)
const initStore = () => M.record({ structSheet: { [s(Model).t]: Model } })


describe("Sch operations", () => {
  describe("#put", () => {
    var store, allSchs

    beforeEach(() => {
      store = M.record()
      allSchs = [M.record, M.list, M.tuple, M.union, M.string, M.bool, M.int16, () => M.string({ v: "json string" })]
    });

    it("#put a child", () => {
      putp(store, "", [{ k: `model_a`, sch: M.string, index: 0 }])
      assert.equal(store.fields.find(a => a.key == "model_a").t, M.STRING)
    })

    it("#put children", () => {
      putp(store, "", allSchs.reverse().map((sch, i) => {
        return { k: `model_${allSchs.length - i}`, sch: sch, index: i }
      }))

      assert.equal(store.fields.length, allSchs.length)
    })

    it("#put a child to List is ignored", () => {
      putp(store, "", [{ k: `list_a`, sch: M.list, index: 0 }])
      putp(store, "[list_a]", [{ k: `aa`, sch: M.bool, index: 0 }])

      assert.equal(store.fields.find(a => a.key == "list_a").sch.t, M.STRING)
    })

    it("#put a child to Tuple", () => {
      putp(store, "", [{ k: `tuple_a`, sch: M.tuple, index: 0 }])
      putp(store, "[tuple_a]", [{ k: `aa`, sch: M.integer, index: 0 }])

      assert.deepEqual(store.fields.find(a => a.key == "tuple_a").schs.map(a => a.t), [M.INTEGER, M.STRING])
    })

    it("#put a child to Union", () => {
      putp(store, "", [{ k: `union_a`, sch: M.union, index: 0 }])
      putp(store, "[union_a]", [{ k: `aa`, sch: M.bool, index: 0 }])

      assert.deepEqual(store.fields.find(a => a.key == "union_a").schs.map(a => a.t), [M.BOOLEAN, M.STRING])
    })

    it("#put a dup key", () => {
      putp(store, "", [{ k: `key`, sch: M.int16, index: 0 }])
      putp(store, "", [{ k: `key`, sch: M.int8, index: 0 }])

      store.fields[0].key == "key -"
      store.fields[1].key == "key"
      assert.equal(store.fields.length, 2)
    })

    it("#put null key", () => {
      putp(store, "", [{ k: null, sch: M.int16, index: 0 }])

      assert.equal(store.fields.length, 1)
      assert.match(store.fields[0].key, /^k/)
    })

    it("#put index number as key", () => {
      putp(store, "", [{ k: 0, sch: M.int16, index: 0 }])

      assert.equal(store.fields.length, 1)
      assert.equal(store.fields[0].key, "0")
    })

    // TODO:
    // it("#put child.index does not exceed total length", () => {
    // })

    // it("#put bulk until halt", () => {
    // })
  })

  describe("#pop", () => {
    var store, allSchs

    beforeEach(() => {
      store = initStore()
      allSchs = [M.record, M.list, M.tuple, M.union, M.string, M.bool, M.int16, () => M.string({ v: "json string" })]
      allSchs.reverse().forEach((sch, i) =>
        putp(store, "", [{ k: `model_${allSchs.length - i}`, sch: sch, index: 0 }])
      )
    });

    it("#pop a child", () => {
      assert.changesBy(() => popp(store, "", [2]), store.fields, "length", 1)
      assert.notIncludeMembers(Object.entries(store.fields).map(a => a.t), [M.TUPLE])
    })

    it("#pop children", () => {
      assert.changesBy(() => popp(store, "", [0, 1, 3]), store.fields, "length", 3)
      assert.notIncludeMembers(Object.entries(store.fields).map(a => a.t), [M.RECORD, M.LIST, M.UNION])
    })

    it("#pop a child out of List, still have a least 1 child", () => {
      putp(store, "", [{ k: `list_a`, sch: M.list, index: 0 }])
      assert.equal(store.fields.find(a => a.key == "list_a").sch.t, M.STRING)

      popp(store, "[list_a]", [0])
      assert.equal(store.fields.find(a => a.key == "list_a").sch.t, M.STRING)
    })

    it("#pop a child out of Tuple, still have a least 1 child", () => {
      putp(store, "", [{ k: `tuple_a`, sch: M.tuple, index: 0 }])
      assert.deepEqual(store.fields.find(a => a.key == "tuple_a").schs.map(a => a.t), [M.STRING])

      popp(store, "[tuple_a]", [0])
      assert.deepEqual(store.fields.find(a => a.key == "tuple_a").schs.map(a => a.t), [M.STRING])
    })

    it("#pop a child out of Union, still have a least 1 child", () => {
      putp(store, "", [{ k: `union_a`, sch: M.union, index: 0 }])
      assert.deepEqual(store.fields.find(a => a.key == "union_a").schs.map(a => a.t), [M.STRING])

      popp(store, "[union_a]", [0])
      assert.deepEqual(store.fields.find(a => a.key == "union_a").schs.map(a => a.t), [M.STRING])
    })

    it("#pop a child out of non-container type", () => {
      putp(store, "", [{ k: `nonBox`, sch: M.string, index: 0 }])
      assert.doesNotChange(() => popp(store, "[nonBox]", [0, 1, 2]), store, "fields")
    })
  })

  describe("#changeT", () => {
    var store

    beforeEach(() => {
      store = M.record()
    })

    it("#changeT to root store is ignored, root is always a record", () => {
      assert.equal(store.t, M.RECORD)
      changeTp(store, "", M.list)
      assert.equal(store.t, M.RECORD)
    })

    it("#changeT to a bunch of type", () => {
      putp(store, "", [{ k: `a`, sch: M.string, index: 0 }])
      assert.equal(store.fields.find(a => a.key == "a").t, M.STRING)

      changeTp(store, "[a]", M.list)
      assert.equal(store.fields.find(a => a.key == "a").t, M.LIST)

      changeTp(store, "[a]", M.int16)
      assert.equal(store.fields.find(a => a.key == "a").t, M.INT16)

      changeTp(store, "[a]", () => M.structSheet.toVal(M.bool(), true))
      assert.equal(store.fields.find(a => a.key == "a").t, M.BOOLEAN)
    })
  })

  describe("#get", () => {
    var store

    beforeEach(() => {
      store = M.record()
    })

    it("#get invalid path", () => {
      assert.equal(getp(store, "bla"), undefined)
    })

    it("#get record path", () => {
      putp(store, "", [{ k: "record", sch: M.record, index: 0 }])
      putp(store, "[record]", [{ k: "b", sch: M.string, index: 0 }])
      assert.equal(getp(store, "[record][b]").t, M.STRING)
    })

    it("#get tuple path", () => {
      putp(store, "", [{ k: "tuple", sch: M.tuple, index: 0 }])
      putp(store, "[tuple]", [{ k: "b", sch: M.bool, index: 0 }])
      assert.equal(getp(store, "[tuple][][0]").t, M.BOOLEAN)
      assert.equal(getp(store, "[tuple][][1]").t, M.STRING)
      assert.equal(getp(store, "[tuple][][2]"), undefined)
      assert.equal(getp(store, "[tuple][]"), undefined)
    })

    it("#get list path", () => {
      putp(store, "", [{ k: "list", sch: M.list, index: 0 }])

      assert.equal(getp(store, "[list][][0]").t, M.STRING)
      assert.equal(getp(store, "[list][][1]"), undefined)
    })
  })

  describe("#move", () => {
    var store

    beforeEach(() => {
      store = M.record()
      putp(store, "", [
        { k: "a_list", sch: M.list, index: 0 },
        { k: "b_tuple", sch: M.tuple, index: 1 },
        { k: "c_string", sch: M.string, index: 2 },
        { k: "d_union", sch: M.union, index: 3 }
      ])
      putp(store, "[b_tuple]", [
        { k: null, sch: M.int8, index: 1 },
        { k: null, sch: M.int16, index: 2 }
      ])
      putp(store, "[d_union]", [
        { k: null, sch: M.int16, index: 1 },
        { k: null, sch: M.record, index: 2 }
      ])
      putp(store, "[d_union][][2]", [
        { k: "descendant", sch: M.string, index: 0 }
      ])
    })

    it("#move same list, one item", () => {
      movep(store, { dstId: "", startIndex: 2 }, { "": [{ id: "0", index: 0 }] })
      assert.deepEqual(store.fields.map(a => a.key), ["b_tuple", "c_string", "a_list", "d_union"])
    })

    it("#move same list, multiple items", () => {
      movep(store, { dstId: "", startIndex: 0 }, { "": [{ id: "2", index: 2 }, { id: "0", index: 0 }] })
      assert.deepEqual(store.fields.map(a => a.key), ["a_list", "c_string", "b_tuple", "d_union"])
    })

    it("#move 1 indexed-src to 1 indexed-dst, one items", () => {
      movep(store, { dstId: "[b_tuple]", startIndex: 0 }, { "[d_union]": [{ id: "2", index: 2 }] })
      assert.deepEqual(store.fields.find(a => a.key == "b_tuple").schs.map(a => a.t), [M.RECORD, M.STRING, M.INT8, M.INT16])
      assert.deepEqual(store.fields.find(a => a.key == "d_union").schs.map(a => a.t), [M.STRING, M.INT16])
    })

    it("#move 2 indexed-src to 1 keyed-dst", () => {
      movep(store, { dstId: "", startIndex: 1 }, { "[d_union]": [{ id: "2", index: 2 }], "[b_tuple]": [{ id: "2", index: 2 }] })
      assert.deepEqual(store.fields.map(a => a.key), ["a_list", "2", "2-", "b_tuple", "c_string", "d_union"])
      assert.deepEqual(store.fields.find(a => a.key == "d_union").schs.map(a => a.t), [M.STRING, M.INT16])
      assert.deepEqual(store.fields.find(a => a.key == "b_tuple").schs.map(a => a.t), [M.STRING, M.INT8])
    })

    it("#move outer into subtree itself, won't collapse (popped without put)", () => {
      movep(store, { dstId: "[d_union][][2]", startIndex: 1 }, { "": [{ id: "[d_union]", index: 3 }] })
      assert.isOk(store.fields.find(a => a.key == "d_union"))
    })

    it("#move mutiple src(s), some of which are subtree (only allow most outer)", () => {
      let d_union_2_nth = getp(store, "[d_union][][2]")
      movep(store, { dstId: "", startIndex: 1 }, { "[d_union][][2]": [{ id: "descendant", index: 0 }], "[d_union]": [{ id: "2", index: 2 }] })
      assert.deepEqual(store.fields.find(a => a.key == store.fields[1].key), d_union_2_nth)
      assert.equal("b_tuple", store.fields[2].key)
    })

    it("#move into one of selected items", () => {
      movep(store, { dstId: "[d_union]", startIndex: 1 }, { "": [{ id: "[d_union]", index: 3 }, { id: "[c_string]", index: 2 }] })
      assert.isOk(store.fields.find(a => a.key == "d_union"))
    })

    // [a-index-0, b-index-1] -> [b-index-0: [a]]
    it("#move index based item into next adjacent item whose dst (index based) path has changed", () => {
      movep(store, { dstId: "[d_union][][2]", startIndex: 1 }, { "[d_union]": [{ id: "item", index: 1 }] })
      const d_union = store.fields.find(a => a.key == "d_union")
      assert.deepEqual(d_union.schs.map(a => a.t), [M.STRING, M.RECORD])
      assert.equal(d_union.schs[1].fields.length, 2)
      assert.equal(d_union.schs[1].fields[1].t, M.INT16)
    })
  })

  describe("#update", () => {
    var store

    beforeEach(() => {
      store = M.record()
      putp(store, "", [{ k: "abc", sch: M.bool, index: 0 }])
    })

    it("#update sch with arbitrary data", () => {
      updatep(store, "[abc]", (a, m) => ({ ...a, whatever: "whatever" }))
      assert.equal(getp(store, "[abc]").whatever, "whatever")
    })

    // it("#bulkUpdate until halt", () => {

    // })
  })

  describe("#onlyMostOuters", () => {
    it("filters descendants out", () => {
      const expect = ["", "a", "ba", "c"]
      const result = onlyMostOuters(["", "", "a", "ab", "ba", "c", "ca"])
      assert.deepEqual(result, expect)
    })
  })
})
