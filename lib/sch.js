import { putAnchor, REF, LITERAL } from "./pkgs/core.js"
import { readable, reduce, forEach, find } from "./utils.js"

export {
  walk, get, put, pop, move, update, getByAndUpdate, filterMostOuters,
  popToRawSchs, copyToRawSchs, putSelected, putSelectedRawSchs, putPoppedRawSchs,
  changeType, clone, copy
}

const clone = (obj) => {
  let sch = JSON.parse(JSON.stringify(obj))
  walk(sch, (a, m) => putAnchor(() => a, { force: true }))
  return sch
}
const copy = obj => JSON.parse(JSON.stringify(obj))

/* Any computed data should be in meta variable.
   Anything needed to be saved across program restart should be in the sch.
 */
const currentMeta = ({ m, t, $a, key, tag }, { path, lpath, level }) =>
  ({ m, t, $a, key, tag, level, path, lpath })

const lPath = (lpath, append) => {
  let lpath_ = lpath.slice(0)
  let { fields, schs, sch, ...append_ } = append
  lpath_.push(append_)
  return lpath_
}
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

const pop = (schema, path, indices) => {
  let result = { original: {}, popped: [] }

  const ChildrenMin = ({ m, t }) => {
    if (!schema.structSheet) return 0
    const sheet = schema.structSheet[m].sheet[t] || schema.structSheet[m].sheet.default
    return sheet?.children?.min || 0
  }

  // TODO: Optimization. could use schema._indices[$a] lookup first.
  walk(schema, (sch_, meta) => {
    if (typeof path == "function" && !path.call(null, sch_, meta)) return sch_
    else if (typeof path != "function" && meta.path != path) return sch_
    else {
      if (typeof path == "string") sch_._halt = true
      if (typeof indices == "function") indices = indices.call(null, sch_, meta)
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

const filterMostOuters = (paths) =>
  paths.filter(p => {
    for (let p_ of paths) {
      if (p == p_) return true
      else if (p.startsWith(p_) && p_ != "") return false
    }
  })

const put = (schema, path, rawSchs) => {
  let result = { original: {}, inserted: [] }

  const boundIndex = (index, length) => {
    index = Math.max(index, 0)
    index = Math.min(index, length)
    return index
  }
  const ChildrenTag = (sch, childSch) => {
    if (!schema.structSheet) return
    const { m, t } = sch
    const sheet = schema.structSheet[m].sheet[t] || schema.structSheet[m].sheet.default
    return sheet?.children?.allowedSchs?.find(a => a.m == childSch.m && a.t == childSch.t)?.tag
  }

  const ChildrenKeyScope = (sch) => {
    if (!schema.structSheet) return []
    const { m, t } = sch
    const sheet = schema.structSheet[m].sheet[t] || schema.structSheet[m].sheet.default
    return sheet?.children?.keyScope || []
  }

  walk(schema, (sch_, meta) => {
    if (typeof path == "function" && !path.call(null, sch_, meta)) return sch_
    else if (typeof path != "function" && meta.path != path) return sch_
    else {
      if (typeof path == "string") sch_._halt = true
      if (typeof rawSchs == "function") rawSchs = rawSchs.call(null, sch_, meta)
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

            k = k == 0 ? "0" : k
            k = k || `${newSch.tag || sch_.keyPrefix || "key"}_${Math.floor(Date.now() / 100)}`
            k = `${k}`
            while (keys[k]) k = `${k} -`
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

const move = (store, { isRefConstraint, dstPath, dstLevel, dstStore, startIndex = 0 }, selectedPerParent) => {
  const pinDst = (store, dstPath, pin) =>
    update(store, dstPath, (a, m) => { readable(a, "_pinId", pin); return a })

  let pin = Symbol(dstPath)
  pinDst(store, dstPath, pin)

  let poppedPerSrc = popToRawSchs(store, selectedPerParent, { dstPath, dstLevel, dstStore, isRefConstraint })
  let moved = putPoppedRawSchs(store, { dstPin: pin, startIndex }, poppedPerSrc)
  return moved
}

const popToRawSchs = (store, selectedPerParent, opts = {}) => {
  let poppedPerSrc = {}
  const srcPaths = filterMostOuters(Object.keys(selectedPerParent))
  if (opts.isRefConstraint == undefined) opts.isRefConstraint = true
  let dstStore = opts.dstStore || store

  for (let srcPath of srcPaths) {
    let selectedItems = selectedPerParent[srcPath]
    const newK = (index) => selectedItems.find(c => c.index == index)?.newK
    const beingRefed = (c) => c.sch?.referrers && c.sch.referrers.length != 0 && opts.isRefConstraint
    const notAtRefLevel = opts.dstLevel != dstStore.refParentLevel

    if (opts.dstPath) {
      let isDstSubtree = find(selectedItems, c => opts.dstPath.startsWith(c.id))
      if (isDstSubtree) continue
    }

    let popping = reduce(selectedItems, (acc, c) => {
      if (beingRefed(c) && notAtRefLevel)
        acc.refed.push(c)
      else
        acc.indices.push(c.index)
      return acc
    }, { indices: [], refed: [] })

    if (opts.isRefConstraint)
      forEach(popping.refed, r => r.setAttribute("data-err", "ref"))

    let result = pop(store, srcPath, popping.indices)
    let rawSchs = result.popped.map(({ k, sch, index }) => {
      return { k: newK(index) || k, sch: () => sch }
    })

    poppedPerSrc[srcPath] = rawSchs
  }

  return poppedPerSrc
}

const putPoppedRawSchs = (store, { dstPin, dstPath, startIndex = 0 }, poppedPerSrc) => {
  const getPinedDst = (store, pin) =>
    getByAndUpdate(store, (a, m) => a._pinId == pin, (a, m) => { readable(a, "_pinned", m); return a })

  startIndex = Math.max(startIndex, 0)
  let moved = {}
  let rawSchs = Object.values(poppedPerSrc)
    .flatMap((popped) => popped)
    .map((raw, i) => Object.assign(raw, { index: startIndex + i }))

  if (dstPin) {
    let dst = getPinedDst(store, dstPin)
    if (dst) dstPath = dst._pinned.path
  }

  let result_ = put(store, dstPath, rawSchs)
  if (result_.inserted.length != 0)
    moved[dstPath] = result_.inserted

  return moved
}

// putSelected should be replaced by putPoppedRawSchs, and we can get rid of putSelectedRawSchs
// as well. It's kind of inconsistent api currently.
const putSelected = (store, { dstPath, startIndex = 0 }, selectedPerParent) => {
  let rawSchs = copyToRawSchs(store, selectedPerParent, { dstPath, startIndex })
  let pasted = putSelectedRawSchs(store, { dstPath }, rawSchs)
  return pasted
}

const copyToRawSchs = (store, selectedPerParent, opts = {}) =>
  reduce(Object.values(selectedPerParent), (acc, cc) => {
    let ids = cc.map(c => c.id)
    let collector = []

    getByAndUpdate(store, (a, m) => {
      if (ids.includes(m.path)) { readable(a, "_meta", m); collector.unshift(a) }
      if (collector.length == ids.length) return true
      return false
    }, (a, m) => a)

    for (let c of cc) {
      if (opts.dstPath && opts.dstPath.startsWith(c.id)) continue
      let sch = collector.find(a => a._meta.path == c.id)
      if (sch) acc.unshift({ k: c.key, sch: () => clone(sch, store), index: opts.startIndex + acc.length, id: c.id })
    }
    return acc
  }, [])

const putSelectedRawSchs = (store, { dstPath }, rawSchs) => {
  let pasted = {}
  let result_ = put(store, dstPath, rawSchs)

  if (result_.inserted.length != 0) pasted[dstPath] = result_.inserted

  return pasted
}

const changeType = (store, path, sch) =>
  update(store, path, (a, m) => {
    let newSch = putAnchor(sch)
    let { title, description, rw, required, $a, key, tag } = a

    const refChanged = newSch.t == REF && newSch.$r != a.$r
    const ValChanged = newSch.t == LITERAL && newSch.v != a.v
    const typeChanged = newSch.t != a.t

    const deniedChange = newSch.$r == $a

    if (deniedChange) return a
    if (typeChanged || ValChanged || refChanged)
      return Object.assign(newSch, { metadata: { title, description, rw, required }, $a, key, tag })
    else
      return a
  })

const get = (currentNode, path) =>
  getByAndUpdate(currentNode, (a, m) => m.path == path, (a, m) => { readable(a, "_meta", m); return a })

const update = (currentNode, path, fupdate) =>
  getByAndUpdate(currentNode, (a, m) => m.path == path, fupdate)

const getByAndUpdate = (currentNode, fget, fupdate) => {
  let foundSch
  walk(currentNode, (sch_, meta) => {
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
