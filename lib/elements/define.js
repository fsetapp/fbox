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
  const { denyFn } = opts
  const cmdsMap = new Map(cmds)
  context.e = e

  let command = cmdsMap.get(e.type)
  if (!command) return

  if (typeof denyFn == "function" && denyFn(context, command)) return
  command(context)
}
