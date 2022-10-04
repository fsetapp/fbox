import { start } from "./app.js"
import { project } from "./backend_fixtures.js"

start({ project })
// testing resilient
start({ project })
let store = document.querySelector("project-store")
store.parentNode.prepend(store)
