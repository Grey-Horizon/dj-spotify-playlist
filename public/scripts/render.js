// HTML Template Rendering with Mustache
export default function renderTemplate(targetId, templateId, data = {}) {
  return fetch(`templates/${templateId}.html`)
    .then((response) => response.text())
    .then((template) => {
      const rendered = Mustache.render(template, data);
      document.getElementById(targetId).innerHTML = rendered;
    });
}
