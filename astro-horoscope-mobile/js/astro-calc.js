(function (global) {
  const SIGNES = global.AstroTheme.SIGNES;

  function norm(long) {
    return ((Number(long) % 360) + 360) % 360;
  }
  function degToZod(long) {
    long = norm(long);
    const idx = Math.floor(long / 30) % 12;
    const d = long % 30;
    const deg = Math.floor(d);
    const min = Math.floor((d - deg) * 60);
    return { abs: long, signeIdx: idx, signeNom: SIGNES[idx], deg, min };
  }
  function longitudeAbsolue(body, dateUTC) {
    let vec = Astronomy.GeoVector(body, dateUTC, true);
    if (Astronomy.Rotation_EQJ_ECT && Astronomy.RotateVector) {
      vec = Astronomy.RotateVector(Astronomy.Rotation_EQJ_ECT(dateUTC), vec);
    }
    return norm(Astronomy.Ecliptic(vec).elon);
  }
  function calculerAscendant(dateUTC, lat, lon) {
    const gst = Astronomy.SiderealTime(dateUTC);
    const lst = (gst * 15 + lon + 360) % 360;
    const eps = 23.4392911 * Math.PI / 180;
    const latR = lat * Math.PI / 180;
    const ramc = lst * Math.PI / 180;
    const y = -Math.cos(ramc);
    const x = Math.sin(ramc) * Math.cos(eps) + Math.tan(latR) * Math.sin(eps);
    let asc = Math.atan2(y, x) * 180 / Math.PI;
    return norm(asc);
  }
  function dateLocalVersUTC(y, m, d, h, min, tzOff) {
    // tzOff hours east of UTC (e.g. +1)
    const utcMs = Date.UTC(y, m - 1, d, h, min) - tzOff * 3600 * 1000;
    return new Date(utcMs);
  }

  function calculerTheme(input) {
    const {
      nom, lat, lon, tzOff, annee, mois, jour, heure, minute, ville, villeLabel
    } = input;
    const dateUTC = dateLocalVersUTC(annee, mois, jour, heure, minute, tzOff);
    const bodies = [
      { id: "a", body: Astronomy.Body.Sun },
      { id: "b", body: Astronomy.Body.Moon },
      { id: "c", body: Astronomy.Body.Mercury },
      { id: "d", body: Astronomy.Body.Venus },
      { id: "e", body: Astronomy.Body.Mars },
      { id: "f", body: Astronomy.Body.Jupiter },
      { id: "g", body: Astronomy.Body.Saturn },
      { id: "h", body: Astronomy.Body.Uranus },
      { id: "i", body: Astronomy.Body.Neptune },
      { id: "j", body: Astronomy.Body.Pluto }
    ];
    const theme = {};
    bodies.forEach(function (b) {
      theme[b.id] = degToZod(longitudeAbsolue(b.body, dateUTC));
    });
    theme.Asc = degToZod(calculerAscendant(dateUTC, lat, lon));
    const sun = theme.a;
    return AstroTheme.save({
      nom: nom || "Client",
      ville: ville || "",
      villeLabel: villeLabel || ville || "",
      lat, lon, tzOff,
      annee, mois, jour,
      heureStr: String(heure).padStart(2, "0") + ":" + String(minute).padStart(2, "0"),
      theme,
      signeIdx: sun.signeIdx,
      signeNom: sun.signeNom,
      signeFolder: AstroTheme.FOLDERS[sun.signeIdx],
      savedAt: new Date().toISOString()
    });
  }

  global.AstroCalc = { calculerTheme, degToZod, norm };
})(window);
