import { render, html } from "uhtml"
import { v4 as uuid } from "uuid"

const RECORD = "record"
const LIST = "list"
const TUPLE = "tuple"
const STRING = "string"
const NUMBER = "number"
const INTEGER = "integer"
const BOOLEAN = "boolean"
const NULL = "null"
const UNION = "union"
const ANY = "any"
const REF = "ref"
const VALUE = "value"
const CONTAINER_TYPES = [RECORD, TUPLE, LIST, UNION]

const MODEL_PREFIX = "def_"

const anySch = () => ({ type: ANY })
const stringSch = () => ({ type: STRING })
const boolSch = () => ({ type: BOOLEAN })
const numberSch = () => ({ type: NUMBER })
const nullSch = () => ({ type: NULL })
const recordSch = () => ({ type: RECORD, fields: {}, order: [] })
const listSch = () => ({ type: LIST, sch: anySch() })
const tupleSch = () => ({ type: TUPLE, schs: [anySch()] })
const unionSch = () => ({ type: UNION, schs: [anySch()] })
const refSch = (anchor) => ({ type: REF, $ref: anchor })
const valueSch = (v) => {
  try {
    v = JSON.parse(v)
    if (
      (v == null) ||
      ([STRING, NUMBER, BOOLEAN].includes(typeof v))
    ) return { type: VALUE, "const": v }
    else return false
  }
  catch (e) { return false }
}
const allSchs = [recordSch, listSch, tupleSch, unionSch, anySch, stringSch, boolSch, numberSch, nullSch, () => valueSch("\"json string\"")]

var store = recordSch()
const clone = (obj) => JSON.parse(JSON.stringify(obj))

const walk = (sch, f, meta = {}) => {
  meta.path = meta.path || ""
  meta.level = meta.level || 0

  switch (true) {
    case [RECORD].includes(sch.type):
      for (let [k, sch_] of Object.entries(sch.fields)) {
        let nextMeta = { path: `${meta.path}[${k}]`, level: meta.level + 1 }
        sch.fields[k] = walk(sch_, f, nextMeta)
      }
      break
    case [TUPLE, UNION].includes(sch.type):
      sch.schs.forEach((sch_, i) => {
        let nextMeta = { path: `${meta.path}[][${i}]`, level: meta.level + 1 }
        sch.schs[i] = walk(sch_, f, nextMeta)
      })
      break
    case [LIST].includes(sch.type):
      let nextMeta = { path: `${meta.path}[][0]`, level: meta.level + 1 }
      sch.sch = walk(sch.sch, f, nextMeta)
      break
    default:
      sch
  }

  return f(sch, meta)
}

const popSchs = (schema, path, indices) => {
  let result = { original: clone(schema), popped: [] }
  let descIndices = indices.sort((a, b) => b - a)

  walk(schema, (sch_, meta) => {
    if (meta.path != path) return sch_
    else {
      switch (sch_.type) {
        case RECORD:
          let ikeys = descIndices.map(i => [i, sch_.order[i]]).filter(([i, k]) => k)

          for (let [i, k] of ikeys) {
            result.popped.unshift({ k: k, sch: sch_.fields[k], index: i })
            delete sch_.fields[k]
          }
          for (let i of descIndices) sch_.order.splice(i, 1)

          break
        case LIST:
          break
        case TUPLE:
          for (let i of descIndices)
            result.popped.unshift({ k: i, sch: sch_.schs.splice(i, 1)[0], index: i })

          if (sch_.schs.length == 0) sch_.schs.splice(0, 0, anySch())
          break
        case UNION:
          for (let i of descIndices)
            result.popped.unshift({ k: i, sch: sch_.schs.splice(i, 1)[0], index: i })

          if (sch_.schs.length == 0) sch_.schs.splice(0, 0, anySch())
          break
        default:
          sch_
      }
      return sch_
    }
  })

  return result
}

const putAnchor = (sch, level) => {
  let newSch = sch()
  if (level == 0)
    newSch.$anchor = newSch.$anchor || `${MODEL_PREFIX}${uuid()}`
  else
    newSch.$anchor = uuid()
  return newSch
}

const putSchs = (schema, path, rawSchs) => {
  let result = { original: clone(schema), inserted: [] }
  let ascRawSchs = rawSchs.sort((a, b) => a.index - b.index)

  walk(schema, (sch_, meta) => {
    if (meta.path != path) return sch_
    else {
      switch (sch_.type) {
        case RECORD:
          for (let { k, sch, index } of ascRawSchs) {
            k = k == 0 ? "0" : k
            k = k || `key_${Math.floor(Date.now() / 100)}`
            while (sch_.fields[k]) k = `${k} –`

            sch_.fields[k] = putAnchor(sch, meta.level)
            sch_.order.splice(index, 0, k)
            result.inserted.push({ k: k, sch: sch_.fields[k], index: index })
          }

          break
        case LIST:
          break
        case TUPLE:
          for (let { k, sch, index } of ascRawSchs) {
            sch_.schs.splice(index, 0, putAnchor(sch, meta.level))
            result.inserted.push({ k: k, sch: sch_.schs[index], index: index })
          }
          break
        case UNION:
          for (let { k, sch, index } of ascRawSchs) {
            sch_.schs.splice(index, 0, putAnchor(sch, meta.level))
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

const moveSchs = (store, { dstPath, startIndex = 0 }, selectedPerParent) => {
  const pinDst = (store, dstPath, pin) =>
    updateSch(store, dstPath, (a, m) => { a._pinId = pin; return a })

  const getPinedDst = (store, pin) =>
    getByAndUpdateSch(store, (a, m) => a._pinId == pin, (a, m) => { a._pinned = m; return a })


  const srcPaths = filterMostOuters(Object.keys(selectedPerParent))
  let moved = {}

  for (let srcPath of srcPaths) {
    let selectedItems = selectedPerParent[srcPath]
    let isDstSubtree = selectedItems.filter(c => dstPath.startsWith(c.id)).length != 0
    const newK = (index) => selectedItems.filter(c => c.index == index)[0]?.newK

    if (!isDstSubtree) {
      let pin = Symbol(srcPath)
      pinDst(store, dstPath, pin)

      let result = popSchs(store, srcPath, selectedItems.map(c => c.index))
      let rawSchs = result.popped.map(({ k, sch, index }, i) => {
        return { k: newK(index) || k, sch: () => sch, index: startIndex + i }
      })

      let dst = getPinedDst(store, pin)
      let result_ = putSchs(store, dst._pinned.path, rawSchs)

      moved[dst._pinned.path] = result_.inserted
    }
  }

  return moved
}

const changeSchType = (store, path, sch) =>
  updateSch(store, path, (a, m) => a = sch())

const getSch = (currentNode, path) =>
  getByAndUpdateSch(currentNode, (a, m) => m.path == path, (a, m) => a)

const updateSch = (currentNode, path, fupdate) =>
  getByAndUpdateSch(currentNode, (a, m) => m.path == path, fupdate)

const getByAndUpdateSch = (currentNode, fget, fupdate) => {
  let foundSch
  walk(currentNode, (sch_, meta) => {
    if (fget(sch_, meta)) return foundSch = fupdate(sch_, meta)
    else return sch_
  })
  return foundSch && { ...foundSch }
}

const newModel = (e) => {
  putSchs(store, "", [{ k: null, sch: recordSch, index: 0 }])
  renderRoot(store)
  let tree = document.querySelector("[role='tree']")
  let firstNode = tree._walker.nextNode()
  selectNode(tree, firstNode, firstNode)
}

const renderRoot = (sch) =>
  viewMain({
    sch: sch,
    ui: { level: 1, tab: 0, rootLevel: 2, models: sch.order.reduce((acc, m) => { acc[sch.fields[m].$anchor] = m; return acc }, {}) },
    path: "", key: "root", parent: { type: RECORD }
  })

const viewMain = (assigns) =>
  render(document.body, html`
    <theme>
      <div style="display: flex;">
        ${true && help()}
        <ul role="tree" aria-multiselectable="true" class="text-sm" style="flex: 2;">
          ${viewModel(assigns)}
        </ul>
      </div>
    </theme>
    ${null && debug()}
  `)

const help = () =>
  html`
  <section class="help text-sm" style="flex: 1;">
    <h2>Add</h2>
    <dl>
      <dt><kbd>shift</kbd> + <kbd>+</kbd></dt>
      <dd>Add random schema to container types (record | union | tuple)</dd>
    </dl>
    <h2>Select</h2>
    <dl>
      <dt><kbd>ArrowUp</kbd> / <kbd>ArrowUp</kbd></dt>
      <dd>Select schema</dd>
    </dl>
    <dl>
      <dt><kbd>shift</kbd> + <kbd>ArrowUp</kbd> / <kbd>ArrowUp</kbd></dt>
      <dd>Select mutiple schema</dd>
    </dl>
    <dl>
      <dt><kbd>Home</kbd></dt>
      <dd>Move to the first element of tree</dd>
    </dl>
    <dl>
      <dt><kbd>End</kbd></dt>
      <dd>Move to the last element of tree</dd>
    </dl>
    <h2>Delete</h2>
    <dl>
      <dt><kbd>Delete</kbd></dt>
      <dd>Delete selected schema</dd>
    </dl>
    <h2>Move</h2>
    <dl>
      <dt><kbd>cmd</kbd> + <kbd>x</kbd></dt>
      <dd>Cut selected schema</dd>
    </dl>
    <dl>
      <dt><kbd>cmd</kbd> + <kbd>v</kbd></dt>
      <dd>Paste schema from (cmd + x) command</dd>
    </dl>
    <h2>Rename key</h2>
    <dl>
      <dt><kbd>Enter</kbd></dt>
      <dd>Enable key editing on a selected schema </dd>
    </dl>
    <dl>
      <dt><kbd>Enter</kbd></dt>
      <dd>submit a changed key with current text input value</dd>
    </dl>
    <dl>
      <dt><kbd>Escape</kbd></dt>
      <dd>Cancel editing</dd>
    </dl>
    <h2>Change type</h2>
    <dl>
      <dt><kbd>shift</kbd> + <kbd>Enter</kbd></dt>
      <dd>Enable type editing on a selected schema</dd>
    </dl>
    <dl>
      <dt><kbd>Enter</kbd></dt>
      <dd>Submit a changed type with current text input value</dd>
    </dl>
    <dl>
      <dt><kbd>Escape</kbd></dt>
      <dd>Cancel editing</dd>
    </dl>
    <dl>
      <dt>
        Note: Changeable types are: <b>record</b>, <b>list</b>, <b>tuple</b>, <b>string</b>, <b>number</b>, <b>boolean</b>, <b>null</b>, <b>union</b>, <b>any</b>.
        <br><br>
        For <b>Ref type</b>, type in the defined top level model name.
        <br><br>
        For <b>Value type</b>, type in any json value (e.g. "a", 1, false, null), array and object json is not allowed (for now).
      </dt>
    <dl>
  </section>
  `
const debug = () =>
  html`
  <section style="width: 50%">
    <pre><code>${JSON.stringify(store, null, '  ')}</code></pre>
  </section>`

const viewModel = (assigns) => {
  switch (true) {
    case assigns.ui.level == 1: return viewFModels(assigns)
    case CONTAINER_TYPES.includes(assigns.sch.type): return viewFolder(assigns)
    default: return viewFile(assigns)
  }
}

const viewFModels = (assigns) =>
  html.for(assigns.sch, assigns.sch.$anchor)`
    <li id="${assigns.path}" .key="${assigns.key}" class="fmodels" role="treeitem" aria-level="${assigns.ui.level}" aria-selected="false" tabindex="-1">
      <ul data-group="${keyedOrIndexed(assigns.sch)}" role="group">
        ${viewItself(assigns)}
      </ul>
    </li>`

const viewFolder = (assigns) =>
  html.for(assigns.sch, assigns.sch.$anchor)`
    <li id="${assigns.path}" .key="${assigns.key}" class="folder" role="treeitem" aria-level="${assigns.ui.level}" aria-selected="false" tabindex="-1">
      <dfn class="h">
        ${viewKey({ ...assigns, key: wordBreakHtml(assigns.key) })}
        ${viewType(assigns)}
      </dfn>
      <ul data-group="${keyedOrIndexed(assigns.sch)}" role="group">
        ${viewItself(assigns)}
      </ul>
    </li>`

const viewFile = (assigns) =>
  html.for(assigns.sch, assigns.sch.$anchor)`
    <li id="${assigns.path}" .key="${assigns.key}" class="file" role="treeitem" aria-level="${assigns.ui.level}" aria-selected="false" tabindex="-1">
      ${viewKey({ ...assigns, key: wordBreakHtml(assigns.key) })}
      ${viewType(assigns)}
    </li>`

const viewItself = (assigns) => {
  switch (true) {
    case [RECORD].includes(assigns.sch.type):
      return viewKeyed(assigns)
      break
    case [TUPLE].includes(assigns.sch.type):
      return viewIndexed(assigns)
      break
    case [LIST].includes(assigns.sch.type):
      return viewSingled(assigns)
      break
    case [UNION].includes(assigns.sch.type):
      return viewNonKeyed(assigns)
      break
    default:
      return html``
  }
}

const viewKeyed = (assigns) =>
  assigns.sch.order.map(k =>
    viewModel({
      key: k,
      sch: assigns.sch.fields[k],
      parent: { type: assigns.sch.type, path: assigns.path },
      ui: { ...assigns.ui, level: assigns.ui.level + 1 },
      path: `${assigns.path}[${k}]`
    })
  )

const viewIndexed = (assigns) =>
  assigns.sch.schs.map((sch, i) =>
    viewModel({
      key: i,
      sch: assigns.sch.schs[i],
      parent: { type: assigns.sch.type, path: assigns.path },
      ui: { ...assigns.ui, level: assigns.ui.level + 1 },
      path: `${assigns.path}[][${i}]`
    })
  )

const viewSingled = (assigns) =>
  viewModel({
    key: 0,
    sch: assigns.sch.sch,
    parent: { type: assigns.sch.type, path: assigns.path },
    ui: { ...assigns.ui, level: assigns.ui.level + 1 },
    path: `${assigns.path}[][${0}]`
  })

const viewNonKeyed = (assigns) =>
  assigns.sch.schs.map((sch, i) =>
    viewModel({
      key: "",
      sch: assigns.sch.schs[i],
      parent: { type: assigns.sch.type, path: assigns.path },
      ui: { ...assigns.ui, level: assigns.ui.level + 1 },
      path: `${assigns.path}[][${i}]`
    })
  )

const indent = (assigns) => `padding-left: ${((assigns.ui.level - 1) * 1.25) + assigns.ui.tab}rem`
const textInput = (id, parentPath, content) =>
  html`<textarea id="${id}" class="no-resize" spellcheck="false" maxlength="256" rows="1" autofocus
    data-parent-path="${parentPath}"
    oninput="${e => e.target.value = e.target.value.replace(/\n/g, "")}"
    >${content}</textarea>`


const viewKey = (assigns) =>
  assigns.ui.level == assigns.ui.rootLevel ? viewKeyRoot(assigns) : viewKeyNonRoot(assigns)
const viewKeyRoot = (assigns) =>
  html`
  <span class="def" style="${indent(assigns)}">
    ${modelTypeText(assigns.sch, assigns.ui)}
  </span>
  <span class="k">${editableKey(assigns)}</span>
  <span class="s">=</span>
  `
const viewKeyNonRoot = (assigns) => {
  switch (true) {
    case assigns.parent.type == UNION:
      return html`
        <span class="" style="${indent(assigns)}"></span>
        <span class="s">|</span>
        `
      break
    case assigns.parent.type == LIST:
      return html`
        <span class="k" style="${indent(assigns)}"></span>
        <span class="s">└</span>
        `
      break
    default:
      return html`
        <span class="k" style="${indent(assigns)}">
          ${editableKey(assigns)}
        </span >
        <span class="s">:</span>
      `
  }
}
const editableKey = (assigns) =>
  (assigns.sch?.uiMode == "editKey") ?
    textInput("key-edit", assigns.parent.path, assigns.key) :
    html`${assigns.key}`

const viewType = (assigns) =>
  assigns.ui.level == assigns.ui.rootLevel ? viewTypeRoot(assigns) : viewTypeNonRoot(assigns)
const viewTypeRoot = (assigns) =>
  html`<span class="t">${editableType(assigns)}</span>`
const viewTypeNonRoot = (assigns) =>
  html`<span class="t">${editableType(assigns)}</span>`
const editableType = (assigns) =>
  (assigns.sch?.uiMode == "editType") ?
    textInput("type-edit", assigns.parent.path, assigns.sch.type) :
    html`${typeText(assigns.sch, assigns.ui)}`

const typeText = (sch, ui) => {
  switch (true) {
    case sch.type == RECORD && jEQ(sch.fields, {}): return "{ any }"
    case sch.type == RECORD: return `{ \xa0 }`
    case sch.type == LIST: return html`[ ${typeText(sch.sch, ui)} ]`
    case sch.type == TUPLE: return "( \xa0 )"
    case sch.type == STRING: return "string"
    case sch.type == NUMBER: return "number"
    case sch.type == INTEGER: return "integer"
    case sch.type == BOOLEAN: return "bool"
    case sch.type == NULL: return "null"
    case sch.type == UNION: return "||"
    case sch.type == ANY: return "any"
    case sch.type == REF && !!ui.models[sch.$ref]: return html`<span class="ref">${sch._text = ui.models[sch.$ref]}</span>`
    case sch.type == REF: return html`<span class="ref notfound" title="Ref type">${`${sch._text} (#404)`}</span>`
    case sch.type == VALUE: return html`<span class="value" title="Value type">${JSON.stringify(sch.const)}</span>`
    default: return "please define what type ${sch} is"
  }
}

const wordBreakHtml = (word) => word
const keyedOrIndexed = (sch) => {
  switch (sch.type) {
    case RECORD: return "keyed"
    case TUPLE: return "indexed"
    case UNION: return "indexed"
    default: return "none"
  }
}

const modelTypeText = (sch, ui) => {
  switch (true) {
    case sch.type == RECORD: return "record"; break
    case sch.type == LIST: return "list"; break
    case sch.type == TUPLE: return "tuple"; break
    case sch.type == UNION: return "union"; break
    default: return "field"
  }
}

const selectedGroupedByParent = (tree, opts = {}) =>
  [...tree.querySelectorAll(`${opts.ops || "[aria-selected='true']"}`)].reduce((acc, child) => {
    let parent = child.parentNode.closest("[role='treeitem']")
    if (!parent) return acc

    let parentLevel = parseInt(parent.getAttribute("aria-level"))
    let children = parent.querySelectorAll(`[aria-level='${parentLevel + 1}'][role='treeitem']`)

    child.index = [...children].indexOf(child)
    acc[parent.id] = acc[parent.id] || []
    acc[parent.id].push(child)
    return acc
  }, {})

const deleteSelected = (tree) => {
  const indicesPerParent = selectedGroupedByParent(tree)

  for (let parentPath of Object.keys(indicesPerParent))
    popSchs(store, parentPath, indicesPerParent[parentPath].map(c => c.index))
}

const renameSelected = (tree, textArea) => {
  let indicesPerParent = selectedGroupedByParent(tree)
  let dstPath = textArea.dataset.parentPath

  indicesPerParent[textArea.dataset.parentPath] =
    indicesPerParent[textArea.dataset.parentPath]
      .filter(c => c.id == textArea._treeItem.id)
      .map(c => ({ id: c.id, newK: textArea.value, index: c.index }))

  let renameIndex = indicesPerParent[textArea.dataset.parentPath][0].index
  let moved = moveSchs(store, { dstPath, startIndex: renameIndex }, indicesPerParent)

  return moved[dstPath][0].k
}

const changeTypeSelected = (tree, textArea) => {
  let newSch = allSchs.filter(sch_ => sch_().type == textArea.value)[0]
  let model = store.order.filter(model => model == textArea.value)[0]
  let valSch = valueSch(textArea.value)

  if (newSch) changeSchType(store, textArea._treeItem.id, newSch)
  else if (model) changeSchType(store, textArea._treeItem.id, () => refSch(store.fields[model].$anchor))
  else if (valSch) changeSchType(store, textArea._treeItem.id, () => valSch)
}

const selectNode = (tree, currentNode, nextStepNode, opts = { focus: true }) => {
  if (nextStepNode) {
    deselectAllNode(tree, currentNode)
    selectMultiNode(nextStepNode, opts)
  }
}
const deselectAllNode = (tree, currentNode) => {
  [...tree.querySelectorAll("[aria-selected='true']")]
    .forEach(item => item.setAttribute("aria-selected", false))
  currentNode.tabIndex = -1
  currentNode.setAttribute("aria-selected", false)

  let _ = [...tree.querySelectorAll(".item-pasted")]
    .forEach(a => a.classList.remove("item-pasted"))
}
const selectMultiNode = (nextStepNode, opts = { focus: true }) => {
  if (nextStepNode) {
    nextStepNode.setAttribute("aria-selected", true)
    nextStepNode.tabIndex = 0
    opts.focus && nextStepNode.focus()
  }
}
const findUnselectedNode = (fstep, nextNode) => {
  do nextNode = fstep()
  while (nextNode?.getAttribute("aria-selected") == "true")
  return nextNode
}
const reselectNodes = (tree, nodes) => {
  for (let newDst of Object.keys(nodes)) {
    let rawSchs = nodes[newDst]

    newDst = tree.querySelector(`[id='${CSS.escape(newDst)}']`)
    let dstLevel = parseInt(newDst.getAttribute("aria-level"))
    let children = newDst.querySelectorAll(`[aria-level='${dstLevel + 1}'][role='treeitem']`)

    deselectAllNode(tree, tree._walker.currentNode)
    rawSchs.map(({ index }) => children[index]).forEach(a => {
      a.classList.add("item-pasted")
      selectMultiNode(a)
      tree._walker.currentNode = a
    })
  }
}

const filterMostOuters = (paths) => {
  return paths.filter(p => {
    for (let p_ of paths) {
      if (p == p_) return true
      else if (p.startsWith(p_)) return false
    }
  })
}

const clearClipboard = (tree) => {
  tree.querySelectorAll(".item-cutting").forEach(a => a.classList.remove("item-cutting"))
  tree._clipboard = null
}

const editSelected = (e, tree, textArea, f) => {
  let currentNode = tree._walker.currentNode

  textArea._treeItem = textArea.closest("[role='treeitem']")
  selectNode(tree, currentNode, textArea._treeItem, { focus: false })

  let currentId = f(tree, textArea) || currentNode.id

  updateSch(store, currentId, (a, m) => ({ ...a, uiMode: "view" }))
  renderRoot(store)

  tree._walker.currentNode = tree.querySelector(`[id='${CSS.escape(currentId)}']`)
  selectNode(tree, currentNode, tree._walker.currentNode)
}
const editKey = (e, tree, textArea) => {
  editSelected(e, tree, textArea, () => {
    let newKey = renameSelected(tree, textArea)
    let ancestor = textArea._treeItem.parentNode.closest("[role='treeitem']")
    return `${ancestor.id}[${newKey}]`
  })
}

const editType = (e, tree, textArea) => {
  editSelected(e, tree, textArea, () => {
    changeTypeSelected(tree, textArea)
    return null
  })
}

const cancelTextArea = (e, tree, textArea) => {
  updateSch(store, textArea._treeItem.id, (a, m) => ({ ...a, uiMode: "view" }))
  renderRoot(store)
  tree._walker.currentNode = tree.querySelector(`[id='${CSS.escape(textArea._treeItem.id)}']`)
  selectNode(tree, textArea._treeItem, tree._walker.currentNode)
}

const handleTextAreaKeyDown = (e, tree) => {
  let currentNode = tree._walker.currentNode
  let textArea = e.target

  switch (e.code) {
    case "Enter":
      if (!e.shiftKey && textArea.id == "key-edit")
        editKey(e, tree, textArea)
      else if (!e.shiftKey && textArea.id == "type-edit")
        editType(e, tree, textArea)
      break
  }
}

function handleTreeKeydown(e) {
  let tree = this
  let currentNode = tree._walker.currentNode

  if (e.target instanceof HTMLTextAreaElement) return handleTextAreaKeyDown(e, tree)

  switch (e.code) {
    case "ArrowUp":
      e.shiftKey ?
        selectMultiNode(tree._walker.previousSibling()) :
        selectNode(tree, currentNode, tree._walker.previousNode())
      e.preventDefault()
      break
    case "ArrowDown":
      e.shiftKey ?
        selectMultiNode(tree._walker.nextSibling()) :
        selectNode(tree, currentNode, tree._walker.nextNode())
      e.preventDefault()
      break
    case "Delete":
      let nextNode =
        findUnselectedNode(() => tree._walker.nextSibling()) ||
        findUnselectedNode(() => tree._walker.previousSibling()) ||
        findUnselectedNode(() => tree._walker.parentNode())

      deleteSelected(tree)
      renderRoot(store)
      selectNode(tree, currentNode, nextNode)
      break
    case "KeyX":
      if (e.metaKey) {
        clearClipboard(tree)

        tree._clipboard = () => selectedGroupedByParent(tree, { ops: ".item-cutting" })
        tree.querySelectorAll("[aria-selected='true']").forEach(a => a.classList.add("item-cutting"))
      }
      break
    case "KeyV":
      const dstSch = getSch(store, tree._walker.currentNode.id)
      if (![RECORD, UNION, TUPLE].includes(dstSch.type)) return

      if (e.metaKey && tree._clipboard) {
        const dstPath = tree._walker.currentNode.id
        const selectedPerParent = tree._clipboard()

        let moved = moveSchs(store, { dstPath, startIndex: 0 }, selectedPerParent)
        renderRoot(store)
        clearClipboard(tree)
        reselectNodes(tree, moved)
      }
      break
    case "Enter":
      let group = currentNode.closest("[role='group']")?.dataset?.group
      let editMode

      if (e.shiftKey) editMode = "editType"
      else if (group == "keyed") editMode = "editKey"

      if (editMode) {
        updateSch(store, currentNode.id, (a, m) => ({ ...a, uiMode: editMode }))
        renderRoot(store)
        let textArea = tree.querySelector("textarea")
        textArea._treeItem = currentNode
        textArea.onblur = e => cancelTextArea(e, tree, textArea)
        textArea.focus()
      }
      break
    case "Home":
      while (tree._walker.parentNode()) { }
      selectNode(tree, currentNode, tree._walker.currentNode)
      break
    case "End":
      while (tree._walker.parentNode()) { }
      tree._walker.nextNode()
      while (tree._walker.nextSibling()) { }
      selectNode(tree, currentNode, tree._walker.currentNode)
      break
    case "Escape":
      clearClipboard(tree)
      break
    default:
      switch (e.key) {
        case "+":
          let randomSch = allSchs[ranInt(allSchs.length)]

          putSchs(store, currentNode.id, [{ k: null, sch: randomSch, index: 0 }])
          renderRoot(store)
          break
      }
  }
}

function handleTreeClick(e) {
  let tree = this
  let prevtNode = tree._walker.currentNode
  let itemTarget = e.target.closest("[role='treeitem']")

  if (itemTarget) {
    tree._walker.currentNode = itemTarget
    selectNode(tree, prevtNode, tree._walker.currentNode, { focus: !tree._walker.currentNode.querySelector("textarea") })
  }
}

const ranInt = max => Math.floor(Math.random() * Math.floor(max));
const jEQ = (obj1, obj2) => JSON.stringify(obj1) == JSON.stringify(obj2)

window.addEventListener("DOMContentLoaded", e => {
  document.querySelectorAll("[role='tree']").forEach(tree => {
    tree._walker = document.createTreeWalker(
      tree,
      NodeFilter.SHOW_ELEMENT,
      {
        acceptNode: function (node) {
          if (node.hasAttribute("aria-selected")) return NodeFilter.FILTER_ACCEPT
          else return NodeFilter.FILTER_SKIP
        }
      },
      false
    )
    tree.onkeydown = handleTreeKeydown
    tree.onclick = handleTreeClick

    let firstNode = tree._walker.nextNode()
    selectNode(tree, firstNode, firstNode)
  })
})

allSchs.reverse().forEach((sch, i) =>
  putSchs(store, "", [{ k: `model_${allSchs.length - i}`, sch: sch, index: 0 }])
)

renderRoot(store)
