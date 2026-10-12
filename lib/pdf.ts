import { jsPDF } from "jspdf";
import type { PublicProfile } from "./validation";
import { recordLines } from "./record-lines";
export function createRegistryPdf(record: PublicProfile, fontBase64: string) {
  const pdf = new jsPDF();
  pdf.addFileToVFS("Registry.ttf", fontBase64);
  pdf.addFont("Registry.ttf", "Registry", "normal");
  pdf.setFont("Registry", "normal");
  let y = 20;
  function line(text: string, size = 10) {
    pdf.setFontSize(size);
    const lines = pdf.splitTextToSize(text, 170) as string[];
    for (const value of lines) {
      if (y > 275) {
        pdf.addPage();
        y = 20;
      }
      pdf.text(value, 20, y);
      y += size === 10 ? 5 : 7;
    }
    y += 1.3;
  }
  line("St John’s Anglican Church, Makurdi", 16);
  line("Church of Nigeria (Anglican Communion)", 11);
  line("CHURCH REGISTRY EXTRACT", 13);
  line(
    "Matching registry record found. This extract reflects information entered by the church administrator.",
  );
  for (const [label, value] of recordLines(record)) line(`${label}: ${value}`);
  line(
    "Keep your church code private. This extract is not a signed sacramental certificate.",
  );
  line(`Downloaded: ${new Date().toISOString().slice(0, 10)}`);
  const pages = pdf.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.text(`SJACM registry · Page ${i} of ${pages}`, 20, 289);
  }
  return pdf;
}
