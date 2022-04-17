import { start } from "./app.js"
import { project } from "./backend_fixtures.js"

// public/index.html page has all types of editors and navtree
// while public/[x]_editor is embeddable pane of single type editor so it can
// be exported separately
start({ project })
