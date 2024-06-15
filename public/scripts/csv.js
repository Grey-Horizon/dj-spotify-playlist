import { renderTemplate, renderProblem } from "./render.js";
// import { authFetch } from "./auth.js";

export default function init() {
  renderTemplate("main", "form", {
    label: "CSV File",
    button: "Get tracks",
    file: true,
  }).then(() => {
    document.getElementById("playlist-form").onsubmit = onSubmit;
  });
}

function onSubmit(event) {
  event.preventDefault();
  //   const file = document.getElementById("playlist-file").files[0];
  //   if (!file) {
  //     return renderProblem("No file selected");
  //   }
  renderProblem("Not implemented");
}
