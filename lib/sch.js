import { putAnchor } from "./pkgs/core.js"
import { readable, reduce, forEach, find } from "./utils.js"

export {
  is, isContainer, walk, get, put, pop, move, update, bulkUpdate, getByAndUpdate,
  popToRawSchs, copyToRawSchs, putSelected, putSelectedRawSchs, putPoppedRawSchs,
  changeT, clone, copy, onlyMostOuters
}

const clone = (obj, f = a => a) => {
  let sch = JSON.parse(JSON.stringify(obj))
  walk(sch, (a, m) => putAnchor(() => f(a, m), { force: true }))
  return sch
}
const copy = obj => JSON.parse(JSON.stringify(obj))
const is = ({ m, t }, sch) => m == sch.m && t == sch.t
const isContainer = sch => !!sch.fields || !!sch.schs || !!sch.sch

/* Any computed data should be in meta variable.
   Anything needed to be saved across program restart should be in the sch.
 */
const currentMeta = ({ m, t, $a, key, tag }, { path, lpath, level }) =>
  ({ m, t, $a, key, tag, level, path, lpath })

export const lPath = (lpath, append) => {
  let lpath_ = lpath.slice(0)
  let { fields, schs, sch, ...append_ } = append
  lpath_.push(append_)
  return lpath_
}
// TODO: how to give a sch and walk and get the same `meta` as walking from store?
// Currently, meta is used as it's scoped by input `sch` so level/index is not global info.
const walk = (sch, f, meta = { path: "", lpath: [sch], level: 1, parent: {} }) => {
  sch = f(sch, meta)
  if (sch._halt || sch._pruned) {
    delete sch._halt
    delete sch._pruned
    return sch
  }

  switch (true) {
    case sch.hasOwnProperty("fields"):
      forEach(sch.fields, (sch_, i) => {
        let k = sch_.key
        let nextMeta = { path: `${meta.path}[${k}]`, level: meta.level + 1, index: i, parent: currentMeta(sch, meta), lpath: lPath(meta.lpath, sch_) }

        sch_ = walk(sch_, f, nextMeta)
        sch.fields[i] = sch_

        if (sch_._halt) return Object.assign(sch, { _halt: true })
      })

      break
    case sch.hasOwnProperty("schs"):
      forEach(sch.schs, (sch_, i) => {
        let nextMeta = { path: `${meta.path}[][${i}]`, level: meta.level + 1, index: i, parent: currentMeta(sch, meta), lpath: lPath(meta.lpath, sch_) }

        sch_ = walk(sch_, f, nextMeta)
        sch.schs[i] = sch_

        if (sch_._halt) return Object.assign(sch, { _halt: true })
      })

      break
    case sch.hasOwnProperty("sch"):
      let sch_ = sch.sch
      let nextMeta = { path: `${meta.path}[][0]`, level: meta.level + 1, index: 0, parent: currentMeta(sch, meta), lpath: lPath(meta.lpath, sch_) }

      sch_ = walk(sch.sch, f, nextMeta)
      sch.sch = sch_

      if (sch_._halt) return Object.assign(sch, { _halt: true })
      break
    default:
      sch
  }

  return sch
}

const pop = (schema, id, indices) => {
  let result = { original: {}, popped: [], src: {} }

  const ChildrenMin = ({ m, t }) => {
    if (!schema.structSheet) return 0
    const sheet = schema.structSheet[m].sheet[t] || schema.structSheet[m].sheet.default
    return sheet?.children?.min || 0
  }

  // TODO: Optimization. could use schema._indices[$a] lookup first.
  walk(schema, (sch_, meta) => {
    if (typeof id == "function" && !id(sch_, meta)) return sch_
    else if (typeof id == "string" && sch_.$a != id) return sch_
    else {
      result.src = { sch: sch_, meta }
      sch_._halt = true
      if (typeof indices == "function") indices = indices(sch_, meta)
      let descIndices = indices.sort((a, b) => b - a)

      switch (true) {
        case sch_.hasOwnProperty("fields"):
          for (let i of descIndices)
            result.popped.unshift({ k: sch_.fields[i].key, sch: sch_.fields.splice(i, 1)[0], index: i })

          break
        case sch_.hasOwnProperty("sch"):
          break
        case sch_.hasOwnProperty("schs"):
          if (sch_.schs.length - descIndices.length >= ChildrenMin(sch_))
            for (let i of descIndices)
              result.popped.unshift({ k: i, sch: sch_.schs.splice(i, 1)[0], index: i })

          break
        default:
          sch_
      }
      return sch_
    }
  })

  return result
}

const onlyMostOuters = paths => {
  const notAnyDescendantOf = p => paths.reduce((acc, p_) => {
    let acc_
    if (p_ == "" || p == p_) acc_ = true
    else acc_ = !p.startsWith(p_)
    return acc && acc_
  }, true)

  const paths_ = paths
    .filter(p => notAnyDescendantOf(p))
    .reduce((acc, a) => Object.assign(acc, { [a]: null }), {})

  return Object.keys(paths_)
}

const put = (schema, id, rawSchs) => {
  let result = { original: {}, inserted: [], dst: {} }

  const boundIndex = (index, length) => {
    index = Math.max(index, 0)
    index = Math.min(index, length)
    return index
  }
  const children = sch => {
    if (!schema.structSheet) return false
    const { m, t } = sch
    const sheet = schema.structSheet[m].sheet[t] || schema.structSheet[m].sheet.default
    return sheet?.children
  }
  const ChildrenTag = (sch, childSch) => {
    const child = children(sch)

    // individual tag has higer precedence
    let tag = child?.anyOf?.find(a => a.m == childSch.m && a.t == childSch.t)?.tag
    tag ||= child?.tag
    return tag
  }

  const ChildrenKeyScope = sch => children(sch)?.keyScope || []

  walk(schema, (sch_, meta) => {
    if (typeof id == "function" && !id(sch_, meta)) return sch_
    else if (typeof id == "string" && sch_.$a != id) return sch_
    else {
      result.dst = { sch: sch_, meta }
      sch_._halt = true
      if (typeof rawSchs == "function") rawSchs = rawSchs(sch_, meta)
      let ascRawSchs = rawSchs.sort((a, b) => a.index - b.index)

      switch (true) {
        case sch_.hasOwnProperty("fields"):
          let childTag = (childSch) => ChildrenTag(sch_, childSch)
          let keyScope = (childSch, prekey) => reduce(ChildrenKeyScope(sch_), (acc, scope) => `${acc}__${childSch[scope]}`, prekey)
          let acc = []
          // create fields lookup for checking duplication on push.
          // Note that this will exclude children being put in this parent (sch_)
          let { keys, anchors } = reduce(sch_.fields, (acc, a) => {
            // Object.assign(acc.keys, { [keyScope(a, a.key)]: true })
            Object.assign(acc.keys, { [a.key]: true })
            Object.assign(acc.anchors, { [a.$a]: true })
            return acc
          }, { keys: {}, anchors: {} })

          for (let { k, sch, index } of ascRawSchs) {
            let newSch = putAnchor(sch)
            if (anchors[newSch.$a]) continue

            if (!children(sch_)?.kDup) {
              k = k == 0 ? "0" : k
              k = k || `${newSch.tag || sch_.keyPrefix || "key"}_${Math.floor(Date.now() / 100)}`
              k = `${k}`
              while (keys[k]) k = `${k} -`
            }
            keys[k] = true
            // TODO: in order to do this, we must stop using path as [id=path]
            // while (keys[keyScope(newSch, k)]) k = `${k} -`
            // keys[keyScope(newSch, k)] = true

            index = boundIndex(index, sch_.fields.length + acc.length)

            newSch.key = k
            newSch.index = index

            let tag = childTag(newSch)
            if (tag) newSch.tag = tag
            else delete newSch.tag

            acc.push(newSch)
            result.inserted.push({ k: newSch.key, sch: newSch, index: index })
          }
          if (ascRawSchs.length != 0)
            sch_.fields.splice(ascRawSchs[0].index, 0, ...acc)

          break
        case sch_.hasOwnProperty("sch"):
          break
        case sch_.hasOwnProperty("schs"):
          for (let { k, sch, index } of ascRawSchs) {
            index = boundIndex(index, sch_.schs.length)
            let newSch = putAnchor(sch)
            newSch.index = index
            sch_.schs.splice(index, 0, newSch)
            result.inserted.push({ k: k, sch: sch_.schs[index], index: index })
          }
          break
        default:
          sch_
      }
      return sch_
    }
  })
  return result
}

const move = (store, { isRefConstraint, dstId, srcGet, dstLevel, dstStore, startIndex = 0 }, selectedPerParent) => {
  const pinDst = (store, dstId, pin) =>
    update(store, dstId, (a, m) => { readable(a, "_pinId", pin); return a })

  let pin = Symbol(dstId)
  let dstSch = pinDst(store, dstId, pin)

  let poppedPerSrc = popToRawSchs(store, selectedPerParent, { dstId, srcGet, dstLevel, dstStore, dstSch, isRefConstraint })
  let moved = putPoppedRawSchs(store, { dstPin: pin, dstId, startIndex }, poppedPerSrc)
  return moved
}

const popToRawSchs = (store, selectedPerParent, opts = {}) => {
  let poppedPerSrc = {}
  const srcIds = onlyMostOuters(Object.keys(selectedPerParent))

  if (opts.isRefConstraint == undefined) opts.isRefConstraint = true
  let dstStore = opts.dstStore || store
  let lpathIds
  if (opts.dstSch) lpathIds = opts.dstSch._meta.lpath.map(l => l.$a)

  for (let srcId of srcIds) {
    let selectedItems = selectedPerParent[srcId]
    const newK = (index) => selectedItems.find(c => c.index == index)?.newK
    const beingRefed = (c) => c.sch?.referrers && c.sch.referrers.length != 0 && opts.isRefConstraint
    const notAtRefLevel = opts.dstLevel != dstStore.refParentLevel

    if (opts.dstSch) {
      let isDstSubtree = find(selectedItems, c => lpathIds.includes(c.id) || opts.dstSch._meta.path.startsWith(c.id))
      // Don't pop src's items if dst is one of its item's subtree
      // (i.e. dst will no longer exist once item is popped)
      if (isDstSubtree) continue
    }

    // Warning: This is a coulping. This module shouldn't have knowledge or care about reference
    // which is just one particular `sch.t`. It should be called as something more general like "pop prevention condition".
    let popping = reduce(selectedItems, (acc, c) => {
      if (beingRefed(c) && notAtRefLevel)
        acc.refed.push(c)
      else
        acc.indices.push(c.index)
      return acc
    }, { indices: [], refed: [] })

    if (opts.isRefConstraint)
      forEach(popping.refed, r => r.setAttribute("data-err", "ref"))

    let srcId_ = opts.srcGet ? (a, m) => opts.srcGet(srcId, a, m) : srcId
    let { popped, src: { sch, meta } } = pop(store, srcId_, popping.indices)
    let rawSchs = popped.map(({ k, sch, index }) => {
      return { k: newK(index) || k, sch: () => sch }
    })

    if (popped.length != 0) {
      poppedPerSrc[sch.$a] = rawSchs
      readable(poppedPerSrc, meta.path, poppedPerSrc[sch.$a])
    }
  }

  return poppedPerSrc
}

const putPoppedRawSchs = (store, { dstPin, dstId, startIndex = 0 }, poppedPerSrc) => {
  const getPinedDst = (store, pin) =>
    getByAndUpdate(store, (a, m) => a._pinId == pin, (a, m) => { readable(a, "_pinned", m); return a })

  startIndex = Math.max(startIndex, 0)
  let moved = {}
  let rawSchs = Object.values(poppedPerSrc)
    .flatMap((popped) => popped)
    .map((raw, i) => Object.assign(raw, { index: startIndex + i }))

  // if (dstPin) {
  //   let dst = getPinedDst(store, dstPin)
  //   if (dst) dstId = Symbol.for(dstPin)
  // }

  let { inserted, dst: { sch, meta } } = put(store, dstId, rawSchs)
  if (inserted.length != 0) {
    moved[sch.$a] = inserted
    moved[meta.path] = moved[sch.$a]
  }

  return moved
}

// putSelected should be replaced by putPoppedRawSchs, and we can get rid of putSelectedRawSchs
// as well. It's kind of inconsistent api currently.
const putSelected = (store, { dstId, startIndex = 0 }, selectedPerParent) => {
  let rawSchs = copyToRawSchs(store, selectedPerParent, { dstId, startIndex })
  let pasted = putSelectedRawSchs(store, { dstId }, rawSchs)
  return pasted
}

const copyToRawSchs = (store, selectedPerParent, opts = {}) =>
  reduce(Object.values(selectedPerParent), (acc, cc) => {
    let ids = cc.map(c => c.id)
    let collector = []

    getByAndUpdate(store, (a, m) => {
      if (ids.includes(a.$a)) { readable(a, "_meta", m); collector.unshift(a) }
      if (collector.length == ids.length) return true
      return false
    }, (a, m) => a)

    for (let c of cc) {
      if (opts.dstId && opts.dstId.startsWith(c.id)) continue
      let sch = collector.find(a => a.$a == c.id)
      if (sch) acc.unshift({ k: c.key, sch: () => clone(sch), index: opts.startIndex + acc.length, id: c.id })
    }
    return acc
  }, [])

const putSelectedRawSchs = (store, { dstId }, rawSchs) => {
  let pasted = {}
  let { inserted, dst: { sch, meta } } = put(store, dstId, rawSchs)

  if (inserted.length != 0) {
    pasted[sch.$a] = inserted
    pasted[meta.path] = pasted[sch.$a]
  }

  return pasted
}

const changeT = (store, id, sch, opts = { force: false }) =>
  update(store, id, (a, m) => {
    let newSch = putAnchor(sch)
    let { title, description, rw, required, $a, key, tag } = a

    const refChanged = newSch.$r != a.$r
    const ValChanged = `${newSch.v}` != `${a.v}`
    const typeChanged = newSch.t != a.t || opts.force
    const deniedChange = newSch.$r == $a

    if (deniedChange) return a
    if (typeChanged || ValChanged || refChanged) {
      if (typeChanged && !opts.force) copyBox(newSch, a)
      return Object.assign(newSch, { $a, key, tag, metadata: { title, description, rw, required } })
    }
    else
      return a
  })

const has = (obj, prop) => obj.hasOwnProperty(prop)
const { assign } = Object
const copyBox = (new_, old) => {
  switch (true) {
    case has(new_, "fields") && has(old, "fields"): return assign(new_.fields, old.fields)
    case has(new_, "fields") && has(old, "schs"): return assign(new_.fields, old.schs.map((a, i) => assign(a, { key: i })))
    // case has(new_,"fields") && has(old,"sch"): return assign(new_.fields, old.sch)

    case has(new_, "schs") && has(old, "fields"): return assign(new_.schs, old.fields)
    case has(new_, "schs") && has(old, "schs"): return assign(new_.schs, old.schs)
    // case has(new_,"schs") && has(old,"sch"): return assign(new_.schs, old.sch)

    // case has(new_,"sch") && has(old,"fields"): return assign(new_.sch, old.sch)
    // case has(new_,"sch") && has(old,"schs"): return assign(new_.sch, old.sch)
    case has(new_, "sch") && has(old, "sch"): return assign(new_.sch, old.sch)

    // case has(new_, "fields") && has(old, "v"): return assign(new_.v, old.v)
  }
}

const get = (currentNode, id) =>
  getByAndUpdate(currentNode, id, (a, m) => { readable(a, "_meta", m); return a })

const update = (currentNode, id, fupdate) =>
  getByAndUpdate(currentNode, id, fupdate)

const bulkUpdate = (currentNode, id, fupdate) => {
  let fget = (a, m) => a.$a == id
  if (typeof id == "function") fget = id

  let result = []
  walk(currentNode, (sch_, meta) => {
    if (fget(sch_, meta)) {
      let updated = fupdate(sch_, meta)
      result.push(updated)
      return updated
    }
    else return sch_
  })
  return result
}

const getByAndUpdate = (currentNode, id, fupdate) => {
  let fget = (a, m) => a.$a == id
  if (typeof id == "function") fget = id

  let foundSch
  walk(currentNode, (sch_, meta) => {
    readable(sch_, "_meta", meta)

    if (fget(sch_, meta)) {
      foundSch = fupdate(sch_, meta)
      foundSch._halt = true
      return foundSch
    }
    else return sch_
  })
  if (foundSch) delete foundSch._halt
  return foundSch
}

// path driven (legacy, deprecation is not decided yet)
export const getp = (store, path) => get(store, (a, m) => m.path == path)
export const putp = (store, path, rawSchs) => put(store, (a, m) => m.path == path, rawSchs)
export const popp = (store, path, includes) => pop(store, (a, m) => m.path == path, includes)
export const movep = (store, path, schsPerParentId) => {
  let dstId_ = path.dstId
  path.dstId = (a, m) => m.path == dstId_
  path.srcGet = (srcId, a, m) => m.path == srcId
  return move(store, path, schsPerParentId)
}
export const changeTp = (store, path, sch) => changeT(store, (a, m) => m.path == path, sch)
export const updatep = (store, path, f) => update(store, (a, m) => m.path == path, f)
