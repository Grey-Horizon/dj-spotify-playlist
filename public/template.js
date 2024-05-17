function loadFile(url, callback) {
  PizZipUtils.getBinaryContent(url, callback);
}
export function generate(data, filename) {
  loadFile("./dj-template.docx", function (error, content) {
    if (error) {
      throw error;
    }
    const zip = new PizZip(content);
    const doc = new window.docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    // Render the document (Replace {first_name} by John, {last_name} by Doe, ...)
    doc.render(data);

    const blob = doc.getZip().generate({
      type: "blob",
      mimeType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      // compression: DEFLATE adds a compression step.
      // For a 50MB output document, expect 500ms additional CPU time
      compression: "DEFLATE",
    });
    // Output the document using Data-URI
    saveAs(blob, filename + ".docx");
  });
}
