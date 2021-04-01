import * as T from "./sch/type.js"
export {
  walk, get, put, pop, move, update, getByAndUpdate, filterMostOuters,
  popToRawSchs, copyToRawSchs, putSelected, putSelectedRawSchs, putPoppedRawSchs,
  changeType, clone, simplify
}

const clone = (obj) => {
  let sch = JSON.parse(JSON.stringify(obj))
  walk(sch, (a, m) => T.putAnchor(() => a, { force: true }))
  return sch
}

const simplify = (sch) =>
  walk(JSON.parse(JSON.stringify(sch)), (a, m) => {
    let { type, $anchor, key, _tag, isEntry } = a
    let common = { type, $anchor, key, _tag }

    // optional
    if (isEntry) Object.assign(common, { isEntry })

    switch (a.type) {
      case T.RECORD:
        let { fields, order } = a
        return Object.assign(common, { fields, order })

      case T.TUPLE:
      case T.UNION:
        let { schs } = a
        return Object.assign(common, { schs })

      case T.LIST:
        let { sch } = a
        return Object.assign(common, { sch })

      case T.VALUE:
        let { const: const_ } = a
        return Object.assign(common, { const: const_ })

      case T.REF:
        let { $ref } = a
        return Object.assign(common, { $ref })

      default:
        return Object.assign(common, {})
    }
  })


/* Any computed data should be in meta variable.
   Anything needed to be saved across program restart should be in the sch.
 */
const walk = (sch, f, meta = { path: "", level: 1, parent: {} }) => {
  delete sch._halt
  sch = f(sch, meta)
  if (sch._halt) return sch

  const currentMeta = ({ _tag, type, $anchor, key }, { path, parent: { prune } }) => ({ _tag, type, $anchor, key, path, prune })

  switch (true) {
    case [T.RECORD].includes(sch.type):
      let keys = Object.keys(sch.fields)

      for (let i = sch.order.length - 1; i >= 0; i--) {
        let k = sch.order[i]
        let sch_ = sch.fields[k]
        let nextMeta = { path: `${meta.path}[${k}]`, level: meta.level + 1, index: i, parent: currentMeta(sch, meta) }
        sch_ = walk(sch_, f, nextMeta)
        sch_.key = k

        sch.fields[k] = sch_
        if (sch_._halt) return Object.assign(sch, { _halt: true })
      }

      break
    case [T.TUPLE, T.UNION].includes(sch.type):
      for (let i = 0; i < sch.schs.length; i++) {
        let sch_ = sch.schs[i]
        let nextMeta = { path: `${meta.path}[][${i}]`, level: meta.level + 1, index: i, parent: currentMeta(sch, meta) }
        sch_ = walk(sch_, f, nextMeta)

        sch.schs[i] = sch_
        if (sch_._halt) return Object.assign(sch, { _halt: true })
      }

      break
    case [T.LIST].includes(sch.type):
      let nextMeta = { path: `${meta.path}[][0]`, level: meta.level + 1, index: 0, parent: currentMeta(sch, meta) }
      let sch_ = walk(sch.sch, f, nextMeta)

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
  let descIndices = indices.sort((a, b) => b - a)

  walk(schema, (sch_, meta) => {
    if (meta.path != path) return sch_
    else {
      switch (sch_.type) {
        case T.RECORD:
          let ikeys = descIndices.map(i => [i, sch_.order[i]]).filter(([i, k]) => k)

          for (let [i, k] of ikeys) {
            result.popped.unshift({ k: k, sch: sch_.fields[k], index: i })
            delete sch_.fields[k]
          }
          for (let i of descIndices) sch_.order.splice(i, 1)

          break
        case T.LIST:
          break
        case T.TUPLE:
          for (let i of descIndices)
            result.popped.unshift({ k: i, sch: sch_.schs.splice(i, 1)[0], index: i })

          if (sch_.schs.length == 0) sch_.schs.splice(0, 0, T.putAnchor(T.any))
          break
        case T.UNION:
          for (let i of descIndices)
            result.popped.unshift({ k: i, sch: sch_.schs.splice(i, 1)[0], index: i })

          if (sch_.schs.length == 0) sch_.schs.splice(0, 0, T.putAnchor(T.any))
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
  let ascRawSchs = rawSchs.sort((a, b) => a.index - b.index)

  const boundIndex = (index, arr) => {
    index = Math.max(index, 0)
    index = Math.min(index, arr.length)
    return index
  }

  walk(schema, (sch_, meta) => {
    if (meta.path != path) return sch_
    else {
      switch (sch_.type) {
        case T.RECORD:
          for (let { k, sch, index } of ascRawSchs) {
            k = k == 0 ? "0" : k

            k = k || `${sch()._tag || "key"}_${Math.floor(Date.now() / 100)}`
            k = `${k}`
            while (sch_.fields[k]) k = `${k} –`
            index = boundIndex(index, sch_.order)

            sch_.fields[k] = T.putAnchor(sch, { tag: schema.put?.tag?.[sch_._tag] })
            sch_.order.splice(index, 0, k)
            result.inserted.push({ k: k, sch: sch_.fields[k], index: index })
          }

          break
        case T.LIST:
          break
        case T.TUPLE:
          for (let { k, sch, index } of ascRawSchs) {
            index = boundIndex(index, sch_.schs)
            sch_.schs.splice(index, 0, T.putAnchor(sch, { tag: schema.put?.tag?.[sch_._tag] }))
            result.inserted.push({ k: k, sch: sch_.schs[index], index: index })
          }
          break
        case T.UNION:
          for (let { k, sch, index } of ascRawSchs) {
            index = boundIndex(index, sch_.schs)
            sch_.schs.splice(index, 0, T.putAnchor(sch, { tag: schema.put?.tag?.[sch_._tag] }))
            result.inserted.push({ k: k, sch: sch_.schs[index], index: index })
          }
        default:
          sch_
      }
      return sch_
    }
  })
  return result
}

const move = (store, { dstPath, startIndex = 0 }, selectedPerParent) => {
  const pinDst = (store, dstPath, pin) =>
    update(store, dstPath, (a, m) => { a._pinId = pin; return a })

  let pin = Symbol(dstPath)
  pinDst(store, dstPath, pin)

  let poppedPerSrc = popToRawSchs(store, selectedPerParent, { dstPath })
  let moved = putPoppedRawSchs(store, { dstPin: pin, startIndex }, poppedPerSrc)
  return moved
}

const popToRawSchs = (store, selectedPerParent, opts = {}) => {
  let poppedPerSrc = {}
  const srcPaths = filterMostOuters(Object.keys(selectedPerParent))

  for (let srcPath of srcPaths) {
    let selectedItems = selectedPerParent[srcPath]
    const newK = (index) => selectedItems.find(c => c.index == index)?.newK

    if (opts.dstPath) {
      let isDstSubtree = selectedItems.filter(c => opts.dstPath.startsWith(c.id)).length != 0
      if (isDstSubtree) continue
    }

    let result = pop(store, srcPath, selectedItems.map(c => c.index))
    let rawSchs = result.popped.map(({ k, sch, index }) => {
      return { k: newK(index) || k, sch: () => sch }
    })

    poppedPerSrc[srcPath] = rawSchs
  }

  return poppedPerSrc
}

const putPoppedRawSchs = (store, { dstPin, dstPath, startIndex = 0 }, poppedPerSrc) => {
  const getPinedDst = (store, pin) =>
    getByAndUpdate(store, (a, m) => a._pinId == pin, (a, m) => { a._pinned = m; return a })

  startIndex = Math.max(startIndex, 0)
  let moved = {}
  let rawSchs = Object.values(poppedPerSrc)
    .flatMap((popped) => popped)
    .map((raw, i) => { return { ...raw, index: startIndex + i } })

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
  Object.values(selectedPerParent).reduce((acc, cc) => {
    let ids = cc.map(c => c.id)
    let collector = []

    getByAndUpdate(store, (a, m) => {
      if (ids.includes(m.path)) { a._meta = m; collector.unshift(a) }
      if (collector.length == ids.length) return true
      return false
    }, (a, m) => a)

    for (let c of cc) {
      if (opts.dstPath && opts.dstPath.startsWith(c.id)) continue
      let sch = collector.find(a => a._meta.path == c.id)
      if (sch) acc.unshift({ k: c.key, sch: () => clone(sch), index: opts.startIndex + acc.length, id: c.id })
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
    let newSch = T.putAnchor(sch)
    switch (true) {
      case newSch.type == T.REF:
      case newSch.type == T.VALUE:
      case newSch.type != a.type:
        let { title, description, rw, required, $anchor, key } = a
        Object.assign(newSch, { metadata: { title, description, rw, required }, $anchor, key })
        return newSch
      default:
        return a
    }
  })

const get = (currentNode, path) =>
  getByAndUpdate(currentNode, (a, m) => m.path == path, (a, m) => { a._meta = m; return a })

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
