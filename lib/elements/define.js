export const define = (name, context, domEvents, opts) => {
  const on = instance => {
    instance.listeners = new Map(domEvents)

    for (let [name, listener] of instance.listeners) {
      listener = e => handleDomEvent(e, context, domEvents, opts)
      instance.addEventListener(name, listener)
      instance.listeners.set(name, listener)
    }
  }
  const off = instance => {
    for (let [name, listener] of instance.listeners || []) {
      instance.removeEventListener(name, listener)
      instance.listeners.delete(name)
    }
  }

  if (customElements.get(name))
    for (let el of document.querySelectorAll(name)) {
      off(el)
      on(el, domEvents)
    }
  else
    customElements.define(name, class extends HTMLElement {
      connectedCallback() { on(this, domEvents) }
      disconnectedCallback() { off(this) }
    })
}

const handleDomEvent = (e, context, cmds = [], opts = {}) => {
  const { denyFn, postFn } = opts
  const cmdsMap = new Map(cmds)
  context.e = e

  let cmdsObj = cmdsMap.get(e.type)
  let preCmd, command, postCmd

  preCmd = cmdsObj.pre
  postCmd = cmdsObj.post

  if (cmdsObj.kbd) {
    let kbdMap = new Map(cmdsObj.kbd)
    command = kbdMap.get(modifiedKey(e))
  }
  if (cmdsObj.selector) {
    let cmdsObj_ = cmdsObj.selector.find(a => e.target.matches(a[0]))?.[1]

    switch (true) {
      case typeof cmdsObj_ == "function":
        command = cmdsObj_
        break
      case !!cmdsObj_?.kbd:
        let cmdMap = new Map(cmdsObj_.kbd)
        command = cmdMap.get(modifiedKey(e))
        break
    }
  }
  if (typeof cmdsObj == "function")
    command = cmdsObj

  // ------------------------------
  if (typeof denyFn == "function" && command && denyFn(context, command)) return

  if (preCmd) preCmd(context)
  if (command) command(context)
  if (postCmd) postCmd(context)

  command = command || preCmd || postCmd
  if (typeof postFn == "function" && command) postFn(context, command)
}

const modifiedKey = ({ shiftKey, metaKey, altKey, ctrlKey, key }) => {
  let cmd = []
  if (shiftKey) cmd.push("shift")
  if (metaKey) cmd.push("meta")
  else if (ctrlKey) cmd.push("meta")
  if (altKey) cmd.push("alt")
  if (key) cmd.push(key)
  return cmd.join("-")
}
