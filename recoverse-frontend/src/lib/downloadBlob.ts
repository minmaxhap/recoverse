export function downloadBlob(blob: Blob, filename: string) {
  // @ts-ignore legacy IE branch
  if (window.navigator && window.navigator.msSaveOrOpenBlob) {
    // @ts-ignore legacy IE branch
    window.navigator.msSaveOrOpenBlob(blob, filename);
    return;
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
