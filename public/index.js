import { start, pullState } from "./app.js"
import { project } from "./backend_fixtures.js"

start()

// testing resilience (re-defining and re-attaching store)
start()
let store = document.querySelector("project-store")
store.parentNode.prepend(store)
//

pullState(project)
