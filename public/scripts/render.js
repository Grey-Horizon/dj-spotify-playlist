// HTML Template Rendering with Mustache
export function renderTemplate(targetId, templateId, data = {}) {
  return fetch(`templates/${templateId}.html`)
    .then((response) => response.text())
    .then((template) => {
      const rendered = Mustache.render(template, data);
      document.getElementById(targetId).innerHTML = rendered;
    });
}

export function renderProblem(
  message = "Something went wrong. Please try again."
) {
  renderTemplate("playlist", "uh-oh", { message });
}

export function renderNothing(targetId) {
  document.getElementById(targetId).innerHTML = "";
}
