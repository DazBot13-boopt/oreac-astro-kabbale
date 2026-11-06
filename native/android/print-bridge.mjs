import { registerPlugin } from "@capacitor/core";

const printer = registerPlugin("OreacPrint");

window.OreacPrint = {
  async savePdf(doc, name) {
    const data = doc.output("datauristring").split(",")[1];
    if (!data) throw new Error("Le PDF généré est vide");
    await printer.printPdf({ data, name });
  },
  async printPage(name = "OREAC Astro Kabbale") {
    await printer.printHtml({ name });
  }
};
