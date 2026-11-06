(function (root) {
  root.OreacPrint = {
    async savePdf(doc, name) {
      if (root.oreacDesktop) {
        const data = doc.output("datauristring").split(",")[1];
        return root.oreacDesktop.savePdf(data, name);
      }
      doc.save(name);
    },
    async printPage() {
      if (root.oreacDesktop) return root.oreacDesktop.printPage();
      root.print();
    }
  };
})(window);
