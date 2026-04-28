/* V-Checker – Main logic */
(() => {
  const $ = (id) => document.getElementById(id);

  const cameraInput      = $("cameraInput");
  const galleryInput     = $("galleryInput");
  const uploadSection    = $("upload-section");
  const previewSection   = $("preview-section");
  const previewImg       = $("preview");
  const previewProcessed = $("previewProcessed");
  const previewSpinner   = $("previewSpinner");
  const tabOriginal      = $("tabOriginal");
  const tabOptimiert     = $("tabOptimiert");
  const thresholdRow     = $("thresholdRow");
  const thresholdSlider  = $("thresholdSlider");
  const thresholdVal     = $("thresholdVal");
  const analyzeBtn       = $("analyzeBtn");
  const resetBtn         = $("resetBtn");
  const progressSection  = $("progress-section");
  const progressFill     = $("progressFill");
  const progressPct      = $("progressPct");
  const progressLabel    = $("progressLabel");
  const resultSection    = $("result-section");
  const verdictEl        = $("verdict");
  const verdictEmoji     = $("verdictEmoji");
  const verdictTitle     = $("verdictTitle");
  const verdictSummary   = $("verdictSummary");
  const findingsList     = $("findingsList");
  const findingsCard     = $("findingsCard");
  const warningBanner    = $("warningBanner");
  const rawTextEl        = $("rawText");

  let processedCanvas = null;
  let cachedGray = null;
  let cachedDims = null;
  let lastRender = null;

  const data = window.V_CHECK_DATA;
  const dropZone = $("dropZone");

  /* ───────── UI language strings ───────── */
  const STRINGS = {
    en: {
      tagline:              "Scan an ingredient list – find out if it's vegan.",
      upload_text:          "Take a photo of the ingredient list or upload one",
      btn_camera:           "Take photo",
      btn_gallery:          "Choose from gallery",
      hint:                 "Tip: shoot from directly above, good lighting, sharp focus.",
      lang_label:           "OCR Language:",
      tab_original:         "Original",
      tab_optimised:        "Optimised",
      threshold_label:      "Threshold",
      btn_new_image:        "↻ New image",
      btn_analyse:          "Analyse →",
      analysing:            "Analysing…",
      ocr_starting:         "Starting OCR engine…",
      ocr_loading:          "Loading OCR engine…",
      ocr_downloading:      "Downloading language pack…",
      ocr_initialising:     "Initialising…",
      ocr_recognising:      "Recognising text…",
      ocr_done:             "Done",
      processing:           "Processing…",
      findings_heading:     "Detected problematic ingredients",
      safe_heading:         "Detected safe ingredients",
      traces_heading:       "Allergy traces (not counted for verdict)",
      raw_text_heading:     "Detected text (OCR)",
      lookup_summary:       "Look up E-number",
      lookup_placeholder:   "e.g. E471 or 471",
      not_in_db:            "Not in database.",
      found_as:             "Found in text as:",
      disclaimer:           "⚠️ This analysis is an automated estimate and does not replace careful examination. OCR errors, ambiguous ingredient names or \"conditional\" E-numbers may affect the result. When in doubt, contact the manufacturer.",
      footer_privacy:       "Data stays local. No cloud, no tracking.",
      footer_imprint:       "Imprint",
      footer_privacy_link:  "Privacy Policy",
      footer_source:        "Source code",
      verdict_no_text:      "No text detected",
      verdict_no_text_sub:  "Please try a sharper or better-lit photo.",
      verdict_non_veg:      "Not vegetarian",
      verdict_non_veg_sub:  "At least one ingredient is animal-derived.",
      verdict_vegetarian:   "Vegetarian, but not vegan",
      verdict_veg_sub:      "Contains dairy, egg or bee products.",
      verdict_prob_vegan:   "Probably vegan – but not certain",
      verdict_prob_vegan_sub: "Contains \"conditional\" ingredients that may be plant-based or animal-derived.",
      verdict_vegan:        "Vegan",
      verdict_vegan_sub:    "No animal-derived or conditional ingredients detected.",
      warn_not_ingredient:  "⚠️ The detected text does not look like an ingredient list. Please check that the photo shows the correct side of the packaging.",
      warn_no_match:        "⚠️ Text was detected but no ingredients could be identified. Please check the detected text below – OCR quality may be too low.",
      tag_non_veg:          "not vegetarian",
      tag_veg:              "not vegan",
      tag_conditional:      "conditional",
      status_vegan:         "vegan",
      status_vegetarian:    "vegetarian, but not vegan",
      status_non_veg:       "animal-derived",
      status_conditional:   "may be plant-based or animal-derived – check with manufacturer",
      no_text_detected:     "(no text detected)",
      badge_vegan:          "Vegan",
      badge_vegetarian:     "Vegetarian",
      badge_conditional:    "Conditional",
      badge_non_veg:        "Not vegetarian",
    },
    de: {
      tagline:              "Foto der Zutatenliste scannen – rausfinden ob es vegan ist.",
      upload_text:          "Foto der Zutatenliste aufnehmen oder hochladen",
      btn_camera:           "Foto aufnehmen",
      btn_gallery:          "Aus Galerie wählen",
      hint:                 "Tipp: von oben fotografieren, gute Beleuchtung, scharfer Fokus.",
      lang_label:           "OCR-Sprache:",
      tab_original:         "Original",
      tab_optimised:        "Optimiert",
      threshold_label:      "Schwellenwert",
      btn_new_image:        "↻ Neues Bild",
      btn_analyse:          "Analysieren →",
      analysing:            "Wird analysiert…",
      ocr_starting:         "OCR-Engine wird gestartet…",
      ocr_loading:          "OCR-Engine wird geladen…",
      ocr_downloading:      "Sprachpaket wird heruntergeladen…",
      ocr_initialising:     "Initialisierung…",
      ocr_recognising:      "Text wird erkannt…",
      ocr_done:             "Fertig",
      processing:           "Verarbeitung…",
      findings_heading:     "Erkannte problematische Zutaten",
      safe_heading:         "Erkannte unbedenkliche Zutaten",
      traces_heading:       "Allergenspuren (zählen nicht für das Ergebnis)",
      raw_text_heading:     "Erkannter Text (OCR)",
      lookup_summary:       "E-Nummer nachschlagen",
      lookup_placeholder:   "z. B. E471 oder 471",
      not_in_db:            "Nicht in der Datenbank.",
      found_as:             "Im Text gefunden als:",
      disclaimer:           "⚠️ Diese Analyse ist eine automatisierte Schätzung und ersetzt keine sorgfältige Prüfung. OCR-Fehler, mehrdeutige Zutatenbezeichnungen oder \"bedingte\" E-Nummern können das Ergebnis beeinflussen. Im Zweifel beim Hersteller nachfragen.",
      footer_privacy:       "Daten bleiben lokal. Keine Cloud, kein Tracking.",
      footer_imprint:       "Impressum",
      footer_privacy_link:  "Datenschutz",
      footer_source:        "Quellcode",
      verdict_no_text:      "Kein Text erkannt",
      verdict_no_text_sub:  "Bitte ein schärferes oder besser beleuchtetes Foto versuchen.",
      verdict_non_veg:      "Nicht vegetarisch",
      verdict_non_veg_sub:  "Mindestens eine Zutat stammt vom Tier.",
      verdict_vegetarian:   "Vegetarisch, aber nicht vegan",
      verdict_veg_sub:      "Enthält Milch-, Ei- oder Bienenprodukte.",
      verdict_prob_vegan:   "Wahrscheinlich vegan – aber nicht sicher",
      verdict_prob_vegan_sub: "Enthält \"bedingte\" Zutaten, die pflanzlich oder tierisch sein können.",
      verdict_vegan:        "Vegan",
      verdict_vegan_sub:    "Keine tierischen oder bedingten Zutaten erkannt.",
      warn_not_ingredient:  "⚠️ Der erkannte Text sieht nicht wie eine Zutatenliste aus. Bitte sicherstellen, dass das Foto die richtige Seite der Verpackung zeigt.",
      warn_no_match:        "⚠️ Text wurde erkannt, aber keine Zutaten konnten identifiziert werden. Den erkannten Text unten prüfen – die OCR-Qualität könnte zu niedrig sein.",
      tag_non_veg:          "nicht vegetarisch",
      tag_veg:              "nicht vegan",
      tag_conditional:      "bedingt",
      status_vegan:         "vegan",
      status_vegetarian:    "vegetarisch, aber nicht vegan",
      status_non_veg:       "tierischen Ursprungs",
      status_conditional:   "kann pflanzlich oder tierisch sein – Hersteller fragen",
      no_text_detected:     "(kein Text erkannt)",
      badge_vegan:          "Vegan",
      badge_vegetarian:     "Vegetarisch",
      badge_conditional:    "Bedingt",
      badge_non_veg:        "Nicht vegetarisch",
    }
  };

  /* ───────── E-number English names ───────── */
  const E_NAMES_EN = {
    "E100":"Curcumin","E101":"Riboflavin","E102":"Tartrazine",
    "E104":"Quinoline Yellow","E110":"Sunset Yellow FCF",
    "E120":"Carmine / Cochineal","E122":"Azorubine","E123":"Amaranth",
    "E124":"Ponceau 4R","E127":"Erythrosine","E129":"Allura Red AC",
    "E131":"Patent Blue V","E132":"Indigotine","E133":"Brilliant Blue FCF",
    "E140":"Chlorophylls","E141":"Copper Complexes of Chlorophylls",
    "E142":"Green S","E150a":"Plain Caramel","E150b":"Caustic Sulphite Caramel",
    "E150c":"Ammonia Caramel","E150d":"Sulphite Ammonia Caramel",
    "E151":"Brilliant Black BN","E153":"Vegetable Carbon","E155":"Brown HT",
    "E160a":"Carotenes","E160b":"Annatto","E160c":"Paprika Extract",
    "E160d":"Lycopene","E160e":"Beta-apo-8'-carotenal","E161b":"Lutein",
    "E161g":"Canthaxanthin","E162":"Beetroot Red / Betanin","E163":"Anthocyanins",
    "E170":"Calcium Carbonate","E171":"Titanium Dioxide","E172":"Iron Oxides",
    "E173":"Aluminium","E174":"Silver","E175":"Gold","E180":"Litholrubine BK",
    "E200":"Sorbic Acid","E202":"Potassium Sorbate","E203":"Calcium Sorbate",
    "E210":"Benzoic Acid","E211":"Sodium Benzoate","E212":"Potassium Benzoate",
    "E213":"Calcium Benzoate","E214":"Ethyl p-hydroxybenzoate",
    "E215":"Sodium Ethyl p-hydroxybenzoate","E218":"Methyl p-hydroxybenzoate",
    "E219":"Sodium Methyl p-hydroxybenzoate","E220":"Sulphur Dioxide",
    "E221":"Sodium Sulphite","E222":"Sodium Hydrogen Sulphite",
    "E223":"Sodium Metabisulphite","E224":"Potassium Metabisulphite",
    "E226":"Calcium Sulphite","E227":"Calcium Hydrogen Sulphite",
    "E228":"Potassium Hydrogen Sulphite","E234":"Nisin","E235":"Natamycin",
    "E239":"Hexamethylene Tetramine","E242":"Dimethyl Dicarbonate",
    "E249":"Potassium Nitrite","E250":"Sodium Nitrite","E251":"Sodium Nitrate",
    "E252":"Potassium Nitrate","E260":"Acetic Acid","E261":"Potassium Acetate",
    "E262":"Sodium Acetates","E263":"Calcium Acetate","E270":"Lactic Acid",
    "E280":"Propionic Acid","E281":"Sodium Propionate","E282":"Calcium Propionate",
    "E283":"Potassium Propionate","E290":"Carbon Dioxide","E296":"Malic Acid",
    "E297":"Fumaric Acid","E300":"Ascorbic Acid","E301":"Sodium Ascorbate",
    "E302":"Calcium Ascorbate","E304":"Fatty Acid Esters of Ascorbic Acid",
    "E306":"Tocopherol-Rich Extracts","E307":"Alpha-Tocopherol",
    "E308":"Gamma-Tocopherol","E309":"Delta-Tocopherol","E310":"Propyl Gallate",
    "E311":"Octyl Gallate","E312":"Dodecyl Gallate","E315":"Isoascorbic Acid",
    "E316":"Sodium Isoascorbate","E319":"TBHQ","E320":"BHA","E321":"BHT",
    "E322":"Lecithins","E325":"Sodium Lactate","E326":"Potassium Lactate",
    "E327":"Calcium Lactate","E330":"Citric Acid","E331":"Sodium Citrates",
    "E332":"Potassium Citrates","E333":"Calcium Citrates","E334":"Tartaric Acid",
    "E335":"Sodium Tartrates","E336":"Potassium Tartrates",
    "E337":"Sodium Potassium Tartrate","E338":"Phosphoric Acid",
    "E339":"Sodium Phosphates","E340":"Potassium Phosphates",
    "E341":"Calcium Phosphates","E343":"Magnesium Phosphates",
    "E350":"Sodium Malates","E351":"Potassium Malate","E352":"Calcium Malates",
    "E353":"Metatartaric Acid","E354":"Calcium Tartrate","E355":"Adipic Acid",
    "E356":"Sodium Adipate","E357":"Potassium Adipate","E363":"Succinic Acid",
    "E380":"Triammonium Citrate","E385":"Calcium Disodium EDTA",
    "E392":"Rosemary Extract","E400":"Alginic Acid","E401":"Sodium Alginate",
    "E402":"Potassium Alginate","E403":"Ammonium Alginate",
    "E404":"Calcium Alginate","E405":"Propylene Glycol Alginate","E406":"Agar",
    "E407":"Carrageenan","E407a":"Processed Eucheuma Seaweed",
    "E410":"Locust Bean Gum","E412":"Guar Gum","E413":"Tragacanth",
    "E414":"Gum Arabic","E415":"Xanthan Gum","E416":"Karaya Gum",
    "E417":"Tara Gum","E418":"Gellan Gum","E422":"Glycerol",
    "E423":"Modified Gum Arabic","E425":"Konjac",
    "E426":"Soybean Hemicellulose","E427":"Cassia Gum",
    "E431":"Polyoxyethylene Stearate",
    "E432":"Polysorbate 20","E433":"Polysorbate 80","E434":"Polysorbate 40",
    "E435":"Polysorbate 60","E436":"Polysorbate 65","E440":"Pectins",
    "E441":"Gelatine",
    "E442":"Ammonium Phosphatides","E444":"Sucrose Acetate Isobutyrate",
    "E445":"Glycerol Esters of Wood Rosin","E460":"Cellulose",
    "E461":"Methyl Cellulose","E462":"Ethyl Cellulose",
    "E463":"Hydroxypropyl Cellulose","E464":"Hydroxypropyl Methyl Cellulose",
    "E465":"Ethyl Methyl Cellulose","E466":"Carboxymethyl Cellulose",
    "E468":"Cross-linked Sodium Carboxymethyl Cellulose",
    "E469":"Hydrolysed Carboxymethyl Cellulose",
    "E470a":"Fatty Acid Salts","E470b":"Magnesium Salts of Fatty Acids",
    "E471":"Mono- and Diglycerides of Fatty Acids",
    "E472a":"Acetic Acid Esters of Mono-/Diglycerides",
    "E472b":"Lactic Acid Esters of Mono-/Diglycerides",
    "E472c":"Citric Acid Esters of Mono-/Diglycerides",
    "E472d":"Tartaric Acid Esters of Mono-/Diglycerides",
    "E472e":"DATEM","E472f":"Mixed Esters of Mono-/Diglycerides",
    "E473":"Sucrose Esters of Fatty Acids","E474":"Sucroglycerides",
    "E475":"Polyglycerol Esters of Fatty Acids",
    "E476":"Polyglycerol Polyricinoleate",
    "E477":"Propylene Glycol Esters of Fatty Acids",
    "E479b":"Thermally Oxidized Soya Bean Oil with Mono- and Diglycerides",
    "E481":"Sodium Stearoyl-2-lactylate","E482":"Calcium Stearoyl-2-lactylate",
    "E483":"Stearyl Tartrate","E491":"Sorbitan Monostearate",
    "E492":"Sorbitan Tristearate","E493":"Sorbitan Monolaurate",
    "E494":"Sorbitan Monooleate","E495":"Sorbitan Monopalmitate",
    "E500":"Sodium Carbonates","E501":"Potassium Carbonates",
    "E503":"Ammonium Carbonates","E504":"Magnesium Carbonates",
    "E507":"Hydrochloric Acid","E508":"Potassium Chloride",
    "E509":"Calcium Chloride","E511":"Magnesium Chloride",
    "E512":"Stannous Chloride","E514":"Sodium Sulphates",
    "E515":"Potassium Sulphates","E516":"Calcium Sulphate",
    "E517":"Ammonium Sulphate","E520":"Aluminium Sulphate",
    "E521":"Aluminium Sodium Sulphate","E522":"Aluminium Potassium Sulphate",
    "E523":"Aluminium Ammonium Sulphate","E524":"Sodium Hydroxide",
    "E525":"Potassium Hydroxide","E526":"Calcium Hydroxide",
    "E527":"Ammonium Hydroxide","E528":"Magnesium Hydroxide",
    "E529":"Calcium Oxide","E530":"Magnesium Oxide",
    "E535":"Sodium Ferrocyanide","E536":"Potassium Ferrocyanide",
    "E538":"Calcium Ferrocyanide","E542":"Bone Phosphate","E551":"Silicon Dioxide",
    "E552":"Calcium Silicate","E553a":"Magnesium Silicates","E553b":"Talc",
    "E554":"Sodium Aluminium Silicate","E555":"Potassium Aluminium Silicate",
    "E556":"Calcium Aluminium Silicate","E558":"Bentonite",
    "E559":"Aluminium Silicate","E570":"Fatty Acids","E574":"Gluconic Acid",
    "E575":"Glucono Delta-Lactone","E576":"Sodium Gluconate",
    "E577":"Potassium Gluconate","E578":"Calcium Gluconate",
    "E579":"Ferrous Gluconate","E585":"Ferrous Lactate",
    "E620":"Glutamic Acid","E621":"Monosodium Glutamate",
    "E622":"Monopotassium Glutamate","E623":"Calcium Diglutamate",
    "E624":"Monoammonium Glutamate","E625":"Magnesium Diglutamate",
    "E626":"Guanylic Acid","E627":"Disodium Guanylate",
    "E628":"Dipotassium Guanylate","E629":"Calcium Guanylate",
    "E630":"Inosinic Acid","E631":"Disodium Inosinate",
    "E632":"Dipotassium Inosinate","E633":"Calcium Inosinate",
    "E634":"Calcium 5'-Ribonucleotides","E635":"Disodium 5'-Ribonucleotides",
    "E640":"Glycine and its Sodium Salt","E650":"Zinc Acetate",
    "E901":"Beeswax","E902":"Candelilla Wax","E903":"Carnauba Wax",
    "E904":"Shellac","E905":"Microcrystalline Wax",
    "E907":"Hydrogenated Poly-1-decene","E912":"Montan Acid Esters",
    "E914":"Oxidized Polyethylene Wax","E920":"L-Cysteine",
    "E927b":"Carbamide / Urea","E938":"Argon","E939":"Helium",
    "E941":"Nitrogen","E942":"Nitrous Oxide","E943a":"Butane",
    "E943b":"Isobutane","E944":"Propane","E948":"Oxygen","E949":"Hydrogen",
    "E950":"Acesulfame K","E951":"Aspartame","E952":"Cyclamates",
    "E954":"Saccharin","E955":"Sucralose","E957":"Thaumatin",
    "E959":"Neohesperidine DC","E960":"Steviol Glycosides","E961":"Neotame",
    "E962":"Aspartame-Acesulfame Salt","E964":"Polyglycitol Syrup",
    "E965":"Maltitol / Maltitol Syrup","E966":"Lactitol","E967":"Xylitol",
    "E968":"Erythritol","E969":"Advantame","E999":"Quillaia Extract",
    "E1103":"Invertase","E1105":"Lysozyme","E1200":"Polydextrose",
    "E1201":"Polyvinylpyrrolidone","E1202":"Polyvinylpolypyrrolidone",
    "E1203":"Polyvinyl Alcohol","E1204":"Pullulan",
    "E1205":"Basic Methacrylate Copolymer","E1206":"Neutral Methacrylate Copolymer",
    "E1207":"Anionic Methacrylate Copolymer",
    "E1208":"Polyvinylpyrrolidone-Vinyl Acetate Copolymer",
    "E1209":"Polyvinyl Alcohol-Polyethylene Glycol Graft Copolymer",
    "E1404":"Oxidised Starch","E1410":"Monostarch Phosphate",
    "E1412":"Distarch Phosphate","E1413":"Phosphated Distarch Phosphate",
    "E1414":"Acetylated Distarch Phosphate","E1420":"Acetylated Starch",
    "E1422":"Acetylated Distarch Adipate","E1440":"Hydroxypropyl Starch",
    "E1442":"Hydroxypropyl Distarch Phosphate",
    "E1450":"Starch Sodium Octenylsuccinate","E1451":"Acetylated Oxidised Starch",
    "E1452":"Starch Aluminium Octenylsuccinate","E1505":"Triethyl Citrate",
    "E1517":"Glyceryl Diacetate","E1518":"Glyceryl Triacetate",
    "E1520":"Propylene Glycol","E1521":"Polyethylene Glycol",
  };

  /* ───────── E-number English notes ───────── */
  const E_NOTES_EN = {
    "E101":"may be microbial/synthetic or from milk/egg",
    "E161g":"synthetic or animal/microbial origin possible",
    "E171":"Banned as food additive in the EU since 2022 – may still appear on packaging from third countries; vegan",
    "E234":"produced by bacteria, check culture medium",
    "E270":"despite the name, plant-based/microbial",
    "E304":"check fatty acid origin","E306":"usually plant-based, check carrier",
    "E307":"usually synthetic/plant-based","E308":"usually synthetic/plant-based",
    "E309":"usually synthetic/plant-based","E322":"soy/sunflower or egg possible",
    "E422":"may be plant-based, synthetic or animal-derived",
    "E432":"check fatty acid origin","E433":"check fatty acid origin",
    "E434":"check fatty acid origin","E435":"check fatty acid origin",
    "E436":"check fatty acid origin","E442":"check fat/glycerin origin",
    "E445":"check glycerin origin",
    "E470a":"may be plant-based or animal-derived",
    "E470b":"may be plant-based or animal-derived",
    "E471":"may be plant-based or animal-derived",
    "E472a":"check fatty acid origin","E472b":"check fatty acid origin",
    "E472c":"check fatty acid origin","E472d":"check fatty acid origin",
    "E472e":"check fatty acid origin","E472f":"check fatty acid origin",
    "E473":"check fatty acid origin","E474":"check fatty acid/glycerin origin",
    "E475":"check fatty acid/glycerin origin",
    "E476":"usually plant-based, check glycerin",
    "E477":"check fatty acid origin","E479b":"check mono-/diglycerides",
    "E481":"check stearic acid origin","E482":"check stearic acid origin",
    "E483":"check stearic acid origin","E491":"check stearic acid origin",
    "E492":"check stearic acid origin","E493":"check fatty acid origin",
    "E494":"check fatty acid origin","E495":"check fatty acid origin",
    "E570":"may be plant-based or animal-derived",
    "E626":"may come from yeast/fish/meat","E627":"may come from yeast/fish/meat",
    "E628":"may come from yeast/fish/meat","E629":"may come from yeast/fish/meat",
    "E630":"may come from meat/fish or fermentation",
    "E631":"may come from meat/fish or fermentation",
    "E632":"may come from meat/fish or fermentation",
    "E633":"may come from meat/fish or fermentation",
    "E634":"check origin","E635":"check origin",
    "E640":"synthetic or animal origin possible",
    "E203":"no longer authorised as a food additive in the EU",
    "E431":"check fatty acid origin",
    "E441":"animal-derived",
    "E542":"from animal bones",
    "E901":"bee product – not vegan","E904":"from lac insects – excluded by V-Label and the Vegetarian Society",
    "E920":"may be synthetic, microbial or animal-derived",
    "E966":"produced from milk sugar (lactose) – vegetarian, not vegan",
    "E1103":"check enzyme origin/carrier",
    "E1105":"usually from egg – not vegan",
    "E1517":"check glycerin origin","E1518":"check glycerin origin",
  };

  /* ───────── Keyword German translations ───────── */
  const KW_DE = {
    "Albumin":                          { labelDe: "Albumin",                    reasonDe: "Herkunft unklar: kann Ei (vegetarisch) oder Blut (nicht vegetarisch) sein. Beim Hersteller erfragen." },
    "Anchovies / Sardines":             { labelDe: "Anchovis / Sardinen",        reasonDe: "Fisch." },
    "Aspic / Jelly":                    { labelDe: "Aspik / Sülze",              reasonDe: "Üblicherweise tierische Gelatine oder Fleischbrühe." },
    "Chitosan":                         { labelDe: "Chitosan",                   reasonDe: "Meist aus Krustentierschalen gewonnen." },
    "Cholesterol":                      { labelDe: "Cholesterin",                reasonDe: "Tierischen Ursprungs." },
    "Carmine / Cochineal":              { labelDe: "Karmin / Cochenille",        reasonDe: "Roter Farbstoff aus zermahlenen Schildläusen (E120)." },
    "Collagen":                         { labelDe: "Kollagen",                   reasonDe: "Aus tierischem Bindegewebe." },
    "Dashi":                            { labelDe: "Dashi",                      reasonDe: "Meist fischbasiert (außer reinem Kombu-Dashi)." },
    "Fish oil":                         { labelDe: "Fischöl",                    reasonDe: "Vom Fisch." },
    "Fish sauce":                       { labelDe: "Fischsauce",                 reasonDe: "Vom Fisch." },
    "Gelatin":                          { labelDe: "Gelatine",                   reasonDe: "Tierisches Kollagen aus Knochen oder Häuten (Schwein oder Rind)." },
    "Isinglass":                        { labelDe: "Hausenblase",                reasonDe: "Fischprodukt, als Klärmittel eingesetzt." },
    "Keratin":                          { labelDe: "Keratin",                    reasonDe: "Aus Haaren, Federn oder Hufen." },
    "Bone char / Bone meal":            { labelDe: "Knochenkohle / Knochenmehl", reasonDe: "Verarbeitungshilfsmittel aus tierischen Knochen." },
    "Rennet (animal)":                  { labelDe: "Lab (tierisch)",             reasonDe: "Aus Kälber- oder Tiermägen." },
    "Lard / Tallow":                    { labelDe: "Schmalz / Talg",             reasonDe: "Tierisches Fett." },
    "Meat / Poultry":                   { labelDe: "Fleisch / Geflügel",         reasonDe: "Enthält Fleisch oder Geflügel." },
    "Fish / Seafood":                   { labelDe: "Fisch / Meeresfrüchte",      reasonDe: "Enthält Fisch oder Meeresfrüchte." },
    "Stock / Broth (animal)":           { labelDe: "Brühe / Fond (tierisch)",    reasonDe: "Fleisch- oder Knochenbrühe." },
    "Offal / Organ meat":               { labelDe: "Innereien / Organfleisch",   reasonDe: "Leber, Niere, Knochenmark oder anderes Organfleisch." },
    "Pepsin":                           { labelDe: "Pepsin",                     reasonDe: "Verdauungsenzym aus Schweinemägen." },
    "Milk / Dairy":                     { labelDe: "Milch / Milchprodukte",      reasonDe: "Enthält Milch oder Milchderivate (vegetarisch, nicht vegan)." },
    "Whey":                             { labelDe: "Molke",                      reasonDe: "Milchderivat – nicht vegan." },
    "Casein / Caseinate":               { labelDe: "Kasein / Kaseinat",          reasonDe: "Milchprotein – nicht vegan." },
    "Butter / Cream":                   { labelDe: "Butter / Sahne",             reasonDe: "Tierisches Milchfett." },
    "Cheese / Yogurt":                  { labelDe: "Käse / Joghurt",             reasonDe: "Milchprodukte – Joghurt ist vegetarisch; Käse kann tierisches Lab enthalten. PDO-Käse (Parmesan, Parmigiano Reggiano, Grana Padano, Pecorino) verwenden traditionell tierisches Lab." },
    "Egg / Egg products":               { labelDe: "Ei / Eiprodukte",            reasonDe: "Enthält Ei oder Eiderivate (vegetarisch, nicht vegan)." },
    "Honey":                            { labelDe: "Honig",                      reasonDe: "Bienenprodukt (vegetarisch, nicht vegan)." },
    "Bee products":                     { labelDe: "Bienenprodukte",             reasonDe: "Bienenwachs, Propolis oder Bienenpollen – nicht vegan." },
    "Royal Jelly":                      { labelDe: "Gelée Royale",               reasonDe: "Gelée Royale – von V-Label und der Vegetarian Society als nicht vegetarisch eingestuft." },
    "Lanolin":                          { labelDe: "Lanolin",                    reasonDe: "Wollwachs – nicht vegan." },
    "Shellac":                          { labelDe: "Schellack",                  reasonDe: "Aus Lackschildläusen (E904) – von V-Label und der Vegetarian Society als nicht vegetarisch eingestuft." },
    "Microbial rennet":                 { labelDe: "Mikrobielles Lab",           reasonDe: "Kein tierisches Enzym – meist vegantauglich, strenge Zertifizierungen prüfen ggf. das Kulturmedium." },
    "Flavouring (unspecified)":         { labelDe: "Aroma (unspezifisch)",       reasonDe: "Herkunft oft unklar – kann pflanzlich oder tierisch sein." },
    "Lecithin":                         { labelDe: "Lecithin",                   reasonDe: "Meist Soja oder Sonnenblume, kann aber aus Ei stammen (E322)." },
    "Mono- and Diglycerides":           { labelDe: "Mono- und Diglyceride",      reasonDe: "Können aus pflanzlichen oder tierischen Fetten stammen (E471/E472)." },
    "Glycerin / Glycerol":              { labelDe: "Glycerin",                   reasonDe: "Kann pflanzlich, synthetisch oder tierisch sein (E422)." },
    "Enzymes":                          { labelDe: "Enzyme",                     reasonDe: "Können mikrobiell, pflanzlich oder tierisch sein." },
    "Omega-3":                          { labelDe: "Omega-3",                    reasonDe: "Kann aus Fischöl oder Algen stammen." },
    "Rennet / Coagulant (unspecified)": { labelDe: "Lab / Koagulant (unspezifisch)", reasonDe: "Kann tierisch oder mikrobiell sein – Etikett prüfen." },
    "Fatty acids":                      { labelDe: "Fettsäuren",                 reasonDe: "Können pflanzlich oder tierisch sein." },
    "Taurine":                          { labelDe: "Taurin",                     reasonDe: "Heute meist synthetisch, Herkunft sollte geprüft werden." },
    "Vitamin A / Retinol":              { labelDe: "Vitamin A / Retinol",        reasonDe: "Kann pflanzlich/synthetisch oder tierisch sein." },
    "Vitamin D3":                       { labelDe: "Vitamin D3",                 reasonDe: "Oft aus Lanolin (Schafwolle); veganes D3 aus Flechten möglich." },
    "Waxes (unspecified)":              { labelDe: "Wachse (unspezifisch)",      reasonDe: "Können pflanzlich, mineralisch oder tierisch sein." },
    "Worcestershire sauce":             { labelDe: "Worcestersauce",             reasonDe: "Enthält traditionell Anchovis – vegane Varianten erhältlich." },
    "Sugar (cane)":                     { labelDe: "Zucker (Rohr)",              reasonDe: "In der EU meist unbedenklich; in manchen Ländern wird Knochenkohle verwendet." },
  };

  const VEGAN_KW_DE = {
    "Water":"Wasser","Salt":"Salz","Sugar":"Zucker",
    "Flour / Grain":"Mehl / Getreide","Starch":"Stärke",
    "Plant oil":"Pflanzenöl","Yeast":"Hefe","Vinegar":"Essig",
    "Cocoa / Chocolate":"Kakao / Schokolade","Soy":"Soja",
    "Nuts / Seeds":"Nüsse / Samen","Seeds":"Saaten",
    "Legumes":"Hülsenfrüchte","Vegetables":"Gemüse","Fruit":"Obst",
    "Fruit juice":"Fruchtsaft","Cereals / Flakes":"Getreide / Flocken",
    "Spices / Herbs":"Gewürze / Kräuter","Individual spices":"Einzelgewürze",
    "Plant sweeteners":"Pflanzliche Süßungsmittel",
    "Maltodextrin":"Maltodextrin","Coffee / Tea":"Kaffee / Tee",
  };

  /* ───────── Legal texts (verbatim from Debug/) ───────── */
  const LEGAL = {
    imprint: {
      de: `<h4>Impressum</h4><p><b>Informationen und Offenlegung gemäß &sect;5 (1) ECG, &sect; 25 MedienG, &sect; 63 GewO und &sect; 14 UGB</b></p> <p><b>Webseitenbetreiber:</b> Christoph Neuwirth</p>
<p><b>Anschrift:</b> Breitenfurterstraße 394/9, 1230 Wien</p>
<p><b>UID-Nr:</b>  <br> <b>Gewerbeaufsichtbehörde:</b>  <br> <b>Mitgliedschaften:</b></p>
<p><b>Kontaktdaten:</b> <br> Telefon: +43 681 10784594 <br> Email: hi2026 [at] christoph [strich] neuwirth [punkt] at <br> Fax: </p>

<p><b>Anwendbare Rechtsvorschrift:</b> www.ris.bka.gv.at <br> <b>Berufsbezeichnung:</b> </p>
<p><b>Online Streitbeilegung:</b> Verbraucher, welche in Österreich oder in einem sonstigen Vertragsstaat der ODR-VO niedergelassen sind, haben die Möglichkeit Probleme bezüglich dem entgeltlichen Kauf von Waren oder Dienstleistungen im Rahmen einer Online-Streitbeilegung (nach OS, AStG) zu lösen. Die Europäische Kommission stellt eine Plattform hierfür bereit: https://ec.europa.eu/consumers/odr</p>
<p><b>Urheberrecht:</b> Die Inhalte dieser Webseite unterliegen, soweit dies rechtlich möglich ist, diversen Schutzrechten (z.B dem Urheberrecht). Jegliche Verwendung/Verbreitung von bereitgestelltem Material, welche urheberrechtlich untersagt ist, bedarf schriftlicher Zustimmung des Webseitenbetreibers.</p><p><b>Haftungsausschluss:</b> Trotz sorgfältiger inhaltlicher Kontrolle übernimmt der Webseitenbetreiber dieser Webseite keine Haftung für die Inhalte externer Links. Für den Inhalt der verlinkten Seiten sind ausschließlich deren Betreiber verantwortlich. Sollten Sie dennoch auf ausgehende Links aufmerksam werden, welche auf eine Webseite mit rechtswidriger Tätigkeit/Information verweisen, ersuchen wir um dementsprechenden Hinweis, um diese nach § 17 Abs. 2 ECG umgehend zu entfernen.<br>Die Urheberrechte Dritter werden vom Betreiber dieser Webseite mit größter Sorgfalt beachtet. Sollten Sie trotzdem auf eine Urheberrechtsverletzung aufmerksam werden, bitten wir um einen entsprechenden Hinweis. Bei Bekanntwerden derartiger Rechtsverletzungen werden wir den betroffenen Inhalt umgehend entfernen.</p>
<p><span>Rechtstext von </span>Quelle: fairesRecht.at in Kooperation mit <b><a href="https://kredit123.at/">Immobilienkredit Vergleich</a></b></p>`,
      en: `<h4>Legal Notice</h4><p><b>Information and disclosure pursuant to &sect;5 (1) ECG, &sect; 25 MedienG, &sect; 63 GewO and &sect; 14 UGB</b></p> <p><b>Website operator:</b> Christoph Neuwirth</p>
<p><b>Address:</b> Breitenfurterstraße 394/9, 1230 Vienna</p>
<p><b>VAT ID No.:</b>  <br> <b>Trade supervisory authority:</b>  <br> <b>Memberships:</b></p>
<p><b>Contact details:</b> <br> Telephone: +43 681 10784594 <br> Email: hi2026 [at] christoph [strich] neuwirth [punkt] at <br> Fax: </p>

<p><b>Applicable legal provision:</b> www.ris.bka.gv.at <br> <b>Professional title:</b> </p>
<p><b>Online dispute resolution:</b> Consumers who are established in Austria or in another contracting state of the ODR Regulation have the option of resolving problems relating to the paid purchase of goods or services within the framework of online dispute resolution (according to OS, AStG). The European Commission provides a platform for this: https://ec.europa.eu/consumers/odr</p>
<p><b>Copyright:</b> The contents of this website are subject, insofar as legally possible, to various protective rights (e.g. copyright). Any use/distribution of provided material that is prohibited by copyright requires the written consent of the website operator.</p><p><b>Disclaimer:</b> Despite careful content control, the website operator of this website assumes no liability for the content of external links. The operators of the linked pages are solely responsible for their content. Should you nevertheless become aware of outgoing links that refer to a website with unlawful activity/information, we request an appropriate notice so that these can be removed immediately in accordance with § 17 para. 2 ECG.<br>The copyrights of third parties are observed with the greatest care by the operator of this website. Should you nevertheless become aware of a copyright infringement, we ask for an appropriate notice. If such legal infringements become known, we will remove the affected content immediately.</p>
<p><span>Rechtstext von </span>Quelle: fairesRecht.at in Kooperation mit <b><a href="https://kredit123.at/">Immobilienkredit Vergleich</a></b></p>`,
    },
    privacy: {
      de: `<h3>      Erklärung zur Informationspflicht      </h3><br>      <p align="center">      <strong>Datenschutzerklärung</strong>      </p>      <p>      In folgender Datenschutzerklärung informieren wir Sie über die wichtigsten Aspekte der Datenverarbeitung      im Rahmen unserer Webseite. Wir erheben und verarbeiten personenbezogene Daten nur auf Grundlage der gesetzlichen      Bestimmungen (Datenschutzgrundverordnung, Telekommunikationsgesetz 2003).      </p>      <p>      Sobald Sie als Benutzer auf unsere Webseite zugreifen oder diese besuchen wird Ihre IP-Adresse, Beginn sowie Beginn und Ende der Sitzung erfasst. Dies ist      technisch bedingt und stellt somit ein berechtigtes Interesse iSv Art 6 Abs 1 lit f DSGVO.      </p>      <h5>Kontakt mit uns</h5>      <p>      <p>Wenn Sie uns, entweder über unser Kontaktformular auf unserer Webseite, oder per Email kontaktieren,      dann werden die von Ihnen an uns übermittelten Daten zwecks Bearbeitung Ihrer Anfrage oder für den Fall von weiteren      Anschlussfragen für sechs Monate bei uns gespeichert. Es erfolgt, ohne Ihre Einwilligung, keine Weitergabe Ihrer übermittelten Daten.</p><h5>Cookies</h5>      <p>Unsere Website verwendet so genannte Cookies.      Dabei handelt es sich um kleine Textdateien, die mit Hilfe des Browsers auf Ihrem Endgerät abgelegt werden.      Sie richten keinen Schaden an. Wir nutzen Cookies dazu, unser Angebot nutzerfreundlich zu gestalten.      Einige Cookies bleiben auf Ihrem Endgerät gespeichert, bis Sie diese löschen. Sie ermöglichen es uns,      Ihren Browser beim nächsten Besuch wiederzuerkennen.      Wenn Sie dies nicht wünschen, so können Sie Ihren Browser so einrichten, dass er Sie über das Setzen von      Cookies informiert und Sie dies nur im Einzelfall erlauben.      Bei der Deaktivierung von Cookies kann die Funktionalität unserer Website eingeschränkt sein.<h5>Google Fonts</h5><p>      Unsere Website verwendet Schriftarten von „Google Fonts". Der      Dienstanbieter dieser Funktion ist:      </p>      <ul>      <li>      Google Ireland Limited Gordon House, Barrow Street Dublin 4. Ireland      </li>      </ul>      <p>      Tel: +353 1 543 1000      </p>      <p>      Beim Aufrufen dieser Webseite lädt Ihr Browser Schriftarten und speichert      diese in den Cache. Da Sie, als Besucher der Webseite, Daten des      Dienstanbieters empfangen kann Google unter Umständen Cookies auf Ihrem      Rechner setzen oder analysieren.      </p>      <p>      Die Nutzung von „Google-Fonts" dient der Optimierung unserer Dienstleistung      und der einheitlichen Darstellung von Inhalten. Dies stellt ein      berechtigtes Interesse im Sinne von Art. 6 Abs. 1 lit. f DSGVO dar.      </p>      <p>      Weitere Informationen zu Google Fonts erhalten Sie unter folgendem Link:      </p>      <ul>      <li>      <a href="https://developers.google.com/fonts/faq">      https://developers.google.com/fonts/faq      </a>      </li>      </ul>      <p>      Weitere Informationen über den Umgang mit Nutzerdaten von Google können Sie      der Datenschutzerklärung entnehmen:      </p>      <ul>      <li>      <a href="https://policies.google.com/privacy?hl=de">      https://policies.google.com/privacy?hl=de      </a>      .      </li>      </ul>      <p>      Google verarbeitet die Daten auch in den USA, hat sich jedoch dem      <br/>      EU-US Privacy-Shield unterworfen.      </p>      <p>      <a href="https://www.privacyshield.gov/EU-US-Framework">      https://www.privacyshield.gov/EU-US-Framework      </a>      </p><h5>      Server-Log Files      </h5>      <p>      Diese Webseite und der damit verbundene Provider erhebt im Zuge der      Webseitennutzung automatisch Informationen im Rahmen sogenannter      „Server-Log Files". Dies betrifft insbesondere:      </p>      <ul>      <li>      IP-Adresse oder Hostname      </li>      <li>      den verwendeten Browser      </li>      <li>      Aufenthaltsdauer auf der Webseite sowie Datum und Uhrzeit      </li>      <li>      aufgerufene Seiten der Webseite      </li>      <li>      Spracheinstellungen und Betriebssystem      </li>      <li>      „Leaving-Page" (auf welcher URL hat der Benutzer die Webseite        verlassen)        </li>        <li>        ISP (Internet Service Provider)        </li>        </ul>        <p>        Diese erhobenen Informationen werden nicht personenbezogen verarbeitet oder        mit personenbezogenen Daten in Verbindung gebracht.        </p>        <p>        Der Webseitenbetreiber behält es sich vor, im Falle von Bekanntwerden        rechtswidriger Tätigkeiten, diese Daten auszuwerten oder zu überprüfen.        </p><h5>Ihre Rechte als Betroffener</h5>      <p>Sie als Betroffener haben bezüglich Ihrer Daten, welche bei uns gespeichert sind grundsätzlich ein Recht auf:</p>      <ul><li>Auskunft</li><li>Löschung der Daten</li><li>Berichtigung der Daten</li><li>Übertragbarkeit der Daten</li><li>Wiederruf und Widerspruch zur Datenverarbeitung</li><li>Einschränkung</li></ul>      <p>Wenn sie vermuten, dass im Zuge der Verarbeitung Ihrer Daten Verstöße gegen das Datenschutzrecht passiert sind,       so haben Sie die Möglichkeit sich bei uns (hi2026 [at] christoph [strich] neuwirth [punkt] at) oder der Datenschutzbehörde zu beschweren.</p><h5>Sie erreichen uns unter folgenden Kontaktdaten:</h5>        <p><b>Webseitenbetreiber:</b> Christoph Neuwirth<br> <b>Telefonnummer:</b> +43 681 10784594<br> <b>Email:</b> hi2026 [at] christoph [strich] neuwirth [punkt] at</p><p><span>Rechtstext von </span>Quelle: fairesRecht.at in Kooperation mit <b><a href="https://kredit123.at/immobilienkredit-finanzierung-vergleich-rechner">Immobilienkredit Rechner</a></b></p>`,
      en: `<h3>      Declaration on the Duty to Provide Information      </h3><br>      <p align="center">      <strong>Privacy Policy</strong>      </p>      <p>      In the following privacy policy, we inform you about the most important aspects of data processing      within the scope of our website. We collect and process personal data only on the basis of the statutory      provisions (General Data Protection Regulation, Telecommunications Act 2003).      </p>      <p>      As soon as you, as a user, access or visit our website, your IP address, start time, as well as the beginning and end of the session are recorded. This is      technically necessary and therefore constitutes a legitimate interest within the meaning of Art. 6 para. 1 lit. f GDPR.      </p>      <h5>Contacting us</h5>      <p>      <p>If you contact us, either via our contact form on our website or by email,      the data you transmit to us will be stored by us for six months for the purpose of processing your inquiry or in case of further      follow-up questions. Your transmitted data will not be passed on without your consent.</p><h5>Cookies</h5>      <p>Our website uses so-called cookies.      These are small text files that are stored on your device with the help of the browser.      They do not cause any damage. We use cookies to make our offer user-friendly.      Some cookies remain stored on your device until you delete them. They enable us to      recognize your browser on your next visit.      If you do not want this, you can set your browser so that it informs you about the setting of      cookies and you only allow this in individual cases.      If cookies are disabled, the functionality of our website may be limited.<h5>Google Fonts</h5><p>      Our website uses fonts from "Google Fonts". The      service provider of this function is:      </p>      <ul>      <li>      Google Ireland Limited Gordon House, Barrow Street Dublin 4. Ireland      </li>      </ul>      <p>      Tel: +353 1 543 1000      </p>      <p>      When this website is accessed, your browser loads fonts and stores      them in the cache. Since you, as a visitor to the website, receive data from the      service provider, Google may, under certain circumstances, set or analyze cookies on your      computer.      </p>      <p>      The use of "Google Fonts" serves to optimize our service      and to present content uniformly. This constitutes a      legitimate interest within the meaning of Art. 6 para. 1 lit. f GDPR.      </p>      <p>      Further information about Google Fonts can be found at the following link:      </p>      <ul>      <li>      <a href="https://developers.google.com/fonts/faq">      https://developers.google.com/fonts/faq      </a>      </li>      </ul>      <p>      Further information about Google's handling of user data can be found in      the privacy policy:      </p>      <ul>      <li>      <a href="https://policies.google.com/privacy?hl=de">      https://policies.google.com/privacy?hl=de      </a>      .      </li>      </ul>      <p>      Google also processes data in the USA, but has submitted to the      <br/>      EU-US Privacy Shield.      </p>      <p>      <a href="https://www.privacyshield.gov/EU-US-Framework">      https://www.privacyshield.gov/EU-US-Framework      </a>      </p><h5>      Server Log Files      </h5>      <p>      This website and the associated provider automatically collect information in the course of      website use within the scope of so-called      "server log files". This particularly concerns:      </p>      <ul>      <li>      IP address or hostname      </li>      <li>      the browser used      </li>      <li>      duration of stay on the website as well as date and time      </li>      <li>      pages of the website accessed      </li>      <li>      language settings and operating system      </li>      <li>      "Leaving page" (the URL on which the user        left the website)        </li>        <li>        ISP (Internet Service Provider)        </li>        </ul>        <p>        This collected information is not processed in a personal manner or        linked to personal data.        </p>        <p>        The website operator reserves the right, in the event that        unlawful activities become known, to evaluate or check this data.        </p><h5>Your rights as a data subject</h5>      <p>As a data subject, you generally have the following rights regarding your data stored by us:</p>      <ul><li>Information</li><li>Deletion of the data</li><li>Correction of the data</li><li>Data portability</li><li>Withdrawal and objection to data processing</li><li>Restriction</li></ul>      <p>If you suspect that violations of data protection law have occurred in the course of processing your data,       you have the option to complain to us (hi2026 [at] christoph [strich] neuwirth [punkt] at) or to the data protection authority.</p><h5>You can reach us at the following contact details:</h5>        <p><b>Website operator:</b> Christoph Neuwirth<br> <b>Telephone number:</b> +43 681 10784594<br> <b>Email:</b> hi2026 [at] christoph [strich] neuwirth [punkt] at</p><p><span>Rechtstext von </span>Quelle: fairesRecht.at in Kooperation mit <b><a href="https://kredit123.at/immobilienkredit-finanzierung-vergleich-rechner">Immobilienkredit Rechner</a></b></p>`,
    },
  };

  /* ───────── UI language state ───────── */
  let uiLang = localStorage.getItem("v-checker-lang") || "en";

  /* ───────── OCR language selection ───────── */
  const savedOcrLang = localStorage.getItem("v-checker-ocr-lang") || "deu";
  let selectedLangs = new Set([savedOcrLang]);

  document.querySelectorAll(".lang-chip").forEach(chip => {
    if (chip.dataset.lang === savedOcrLang) {
      document.querySelectorAll(".lang-chip").forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
    }
    chip.addEventListener("click", () => {
      document.querySelectorAll(".lang-chip").forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      selectedLangs = new Set([chip.dataset.lang]);
      localStorage.setItem("v-checker-ocr-lang", chip.dataset.lang);
    });
  });

  /* ───────── UI language toggle ───────── */
  $("uiLangDe").addEventListener("click", () => applyLang("de"));
  $("uiLangEn").addEventListener("click", () => applyLang("en"));

  function applyLang(lang) {
    uiLang = lang;
    localStorage.setItem("v-checker-lang", lang);
    document.documentElement.lang = lang;

    const S = STRINGS[lang];

    document.querySelectorAll("[data-i18n]").forEach(el => {
      const key = el.dataset.i18n;
      if (S[key] !== undefined) el.textContent = S[key];
    });

    document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
      const key = el.dataset.i18nPlaceholder;
      if (S[key] !== undefined) el.placeholder = S[key];
    });

    $("uiLangDe").classList.toggle("active", lang === "de");
    $("uiLangEn").classList.toggle("active", lang === "en");

    // Re-render lookup if active
    if (lookupInput.value.trim()) lookupInput.dispatchEvent(new Event("input"));

    // Re-render results if visible
    if (!resultSection.classList.contains("hidden") && lastRender) {
      renderResult(lastRender.findings, lastRender.veganFindings, lastRender.rawText, lastRender.tracesText);
    }

    // Update modal content if open
    const modal = $("modal");
    if (!modal.classList.contains("hidden") && modal.dataset.type) {
      $("modalContent").innerHTML = LEGAL[modal.dataset.type][lang];
    }
  }

  /* ───────── Modal ───────── */
  function openModal(type) {
    const modal = $("modal");
    modal.dataset.type = type;
    $("modalContent").innerHTML = LEGAL[type][uiLang];
    modal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    $("modal").classList.add("hidden");
    document.body.style.overflow = "";
  }

  $("modalClose").addEventListener("click", closeModal);
  $("modalOverlay").addEventListener("click", closeModal);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });

  $("linkImpressum").addEventListener("click", (e) => { e.preventDefault(); openModal("imprint"); });
  $("linkDatenschutz").addEventListener("click", (e) => { e.preventDefault(); openModal("privacy"); });

  /* ───────── Tesseract check ───────── */
  if (typeof Tesseract === "undefined") {
    showFatalError(
      "OCR engine could not be loaded.",
      "Make sure the page is opened via a local server (not as file://) and an internet connection is available. Tip: run <code>python3 -m http.server</code> in the project folder and open <a href='http://localhost:8000'>http://localhost:8000</a>."
    );
  }

  /* ───────── File handling ───────── */
  cameraInput.addEventListener("change", onFile);
  galleryInput.addEventListener("change", onFile);
  resetBtn.addEventListener("click", reset);

  dropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropZone.classList.add("drag-over");
  });
  dropZone.addEventListener("dragleave", () => dropZone.classList.remove("drag-over"));
  dropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropZone.classList.remove("drag-over");
    const file = e.dataTransfer.files && e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) loadFile(file);
  });

  /* ───────── Threshold slider ───────── */
  thresholdSlider.addEventListener("input", () => {
    if (!cachedGray || !cachedDims) return;
    const t = parseInt(thresholdSlider.value);
    thresholdVal.textContent = t;
    processedCanvas = applyThreshold(cachedGray, cachedDims.w, cachedDims.h, t);
    previewProcessed.src = processedCanvas.toDataURL("image/png");
  });

  /* ───────── Preview tabs ───────── */
  tabOriginal.addEventListener("click", () => {
    tabOriginal.classList.add("active");
    tabOptimiert.classList.remove("active");
    previewImg.classList.remove("hidden");
    previewProcessed.classList.add("hidden");
  });
  tabOptimiert.addEventListener("click", () => {
    tabOptimiert.classList.add("active");
    tabOriginal.classList.remove("active");
    previewProcessed.classList.remove("hidden");
    previewImg.classList.add("hidden");
  });

  analyzeBtn.addEventListener("click", () => {
    const useProcessed = tabOptimiert.classList.contains("active");
    runOcr(useProcessed ? processedCanvas : previewImg.src);
  });

  function onFile(e) {
    const file = e.target.files && e.target.files[0];
    if (file) loadFile(file);
  }

  function loadFile(file) {
    processedCanvas = null;
    analyzeBtn.disabled = true;
    previewSpinner.classList.remove("hidden");

    const url = URL.createObjectURL(file);
    previewImg.src = url;
    previewImg.classList.add("hidden");
    previewProcessed.src = "";

    tabOptimiert.classList.add("active");
    tabOriginal.classList.remove("active");
    previewProcessed.classList.remove("hidden");
    previewImg.classList.add("hidden");

    uploadSection.classList.add("hidden");
    previewSection.classList.remove("hidden");
    resultSection.classList.add("hidden");
    warningBanner.classList.add("hidden");

    previewImg.onload = () => {
      const { canvas, threshold } = preprocessImage(previewImg);
      processedCanvas = canvas;
      previewProcessed.src = canvas.toDataURL("image/png");
      thresholdSlider.value = threshold;
      thresholdVal.textContent = threshold;
      thresholdRow.classList.remove("hidden");
      previewSpinner.classList.add("hidden");
      analyzeBtn.disabled = false;
    };
  }

  function reset() {
    cameraInput.value = "";
    galleryInput.value = "";
    processedCanvas = null;
    lastRender = null;
    uploadSection.classList.remove("hidden");
    previewSection.classList.add("hidden");
    progressSection.classList.add("hidden");
    resultSection.classList.add("hidden");
    progressFill.style.background = "";
    progressFill.style.width = "0%";
    progressPct.textContent = "0 %";
    analyzeBtn.disabled = true;
  }

  function showFatalError(title, detail) {
    uploadSection.innerHTML = `
      <div style="text-align:center;padding:24px 8px">
        <div style="font-size:48px">⚠️</div>
        <p style="font-weight:600;margin:12px 0 6px">${title}</p>
        <p style="color:var(--muted);font-size:14px">${detail}</p>
      </div>`;
  }

  function showOcrError(err) {
    const isWorkerError = err && (
      String(err).includes("worker") ||
      String(err).includes("fetch") ||
      String(err).includes("network") ||
      String(err).includes("CORS")
    );
    const hint = isWorkerError
      ? "The OCR engine could not start. Common cause: the page was opened as <code>file://</code> instead of via a server. Fix: run <code>python3 -m http.server</code> in the project folder and open <a href='http://localhost:8000'>http://localhost:8000</a>."
      : "Unknown error. See browser console (F12) for details. Please reload the page and try again.";
    resultSection.classList.remove("hidden");
    resultSection.innerHTML = `
      <div class="verdict uncertain" style="flex-direction:column;align-items:flex-start;gap:8px">
        <div style="font-size:40px">⚠️</div>
        <div>
          <h2 style="margin:0 0 4px">Text recognition failed</h2>
          <p style="margin:0;font-size:14px">${hint}</p>
        </div>
        <button class="btn btn-secondary" onclick="location.reload()">Reload page</button>
      </div>`;
  }

  /* ───────── OCR ───────── */
  async function runOcr(file) {
    const S = STRINGS[uiLang];
    analyzeBtn.disabled = true;
    progressSection.classList.remove("hidden");
    setProgress(2, S.ocr_starting);

    try {
      if (typeof Tesseract === "undefined") throw new Error("Tesseract not loaded");

      const langs = [...selectedLangs].join("+");
      const { data: { text } } = await Tesseract.recognize(file, langs, {
        logger: (m) => {
          const p = m.progress || 0;
          const S2 = STRINGS[uiLang];
          if (m.status === "loading tesseract core") {
            setProgress(2 + p * 18, S2.ocr_loading);
          } else if (m.status === "loading language traineddata") {
            setProgress(20 + p * 35, `${S2.ocr_downloading} ${Math.round(p * 100)} %`);
          } else if (m.status === "initializing api" || m.status === "initializing tesseract") {
            setProgress(55 + p * 15, S2.ocr_initialising);
          } else if (m.status === "recognizing text") {
            setProgress(70 + p * 30, S2.ocr_recognising);
          }
        },
      });

      setProgress(100, STRINGS[uiLang].ocr_done);
      const cleaned = cleanText(text);
      const { findings, veganFindings, tracesText } = analyze(cleaned);
      renderResult(findings, veganFindings, text, tracesText);
      analyzeBtn.disabled = false;
    } catch (err) {
      console.error(err);
      progressSection.classList.add("hidden");
      analyzeBtn.disabled = false;
      showOcrError(err);
    }
  }

  function setProgress(pct, label) {
    pct = Math.min(100, Math.round(pct));
    progressFill.style.width = pct + "%";
    progressPct.textContent = pct + " %";
    if (label) progressLabel.textContent = label;
  }

  /* ───────── Text cleanup ───────── */
  function cleanText(t) {
    return t
      .replace(/­/g, "")                   // soft hyphen
      .replace(/-\s*\n\s*/g, "")           // hyphen line-break
      .replace(/\s*\n\s*/g, " ")           // newlines → spaces
      .replace(/\s+/g, " ")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "") // strip combining diacritics: ä→a, é→e …
      .replace(/ß/g, "ss")                 // ß → ss
      .trim();
  }

  /* ───────── Traces / allergy notice splitting ───────── */
  function splitTraces(text) {
    const PATTERNS = [
      /\bspuren\s+von\b/i, /\bkann\s+spuren\b/i, /\bspuren\s*:/i,
      /\ballergenspuren\b/i, /\bkreuzkontamination\b/i,
      /\bmay\s+contain\b/i, /\btraces\s+of\b/i,
      /\bmanufactured\s+in\s+a\s+facility\b/i,
      /\bpeut\s+contenir\b/i, /\btraces\s+de\b/i,
      /\bpu[oò]\s+contenere\b/i, /\btracce\s+di\b/i,
      /\bpuede\s+contener\b/i, /\btrazas\s+de\b/i,
    ];

    let splitIdx = text.length;
    for (const pat of PATTERNS) {
      const m = pat.exec(text);
      if (m && m.index < splitIdx) splitIdx = m.index;
    }

    return {
      mainText:   text.slice(0, splitIdx).trim(),
      tracesText: text.slice(splitIdx).trim(),
    };
  }

  /* ───────── Multilingual term helper ───────── */
  const LANG_KEYS = { eng: "termsEn", fra: "termsFr", ita: "termsIt", spa: "termsEs" };

  function getTerms(kw) {
    const all = [...(kw.terms || [])];
    for (const [lang, key] of Object.entries(LANG_KEYS)) {
      if (selectedLangs.has(lang) && kw[key]) all.push(...kw[key]);
    }
    return all;
  }

  /* ───────── Analysis ───────── */
  function analyze(text) {
    const { mainText, tracesText } = splitTraces(text);
    const analysisText = mainText || text;

    const findings = [];
    const veganFindings = [];
    const seenLabels = new Set();

    function matchKeywords(list, prefix) {
      for (const kw of list) {
        const terms = getTerms(kw);

        const excludeRanges = [];
        if (kw.exclude) {
          for (const ex of kw.exclude) {
            let from = 0, idx;
            while ((idx = analysisText.indexOf(ex, from)) !== -1) {
              excludeRanges.push([idx, idx + ex.length]);
              from = idx + ex.length;
            }
          }
        }

        let foundTerm = null;
        for (const term of terms) {
          let from = 0, idx;
          while ((idx = analysisText.indexOf(term, from)) !== -1) {
            const excluded = excludeRanges.some(([a, b]) => idx >= a && idx + term.length <= b);
            if (!excluded) { foundTerm = term; break; }
            from = idx + term.length;
          }
          if (foundTerm) break;
        }

        const key = prefix + kw.label;
        if (foundTerm && !seenLabels.has(key)) {
          seenLabels.add(key);
          const kwDE = KW_DE[kw.label] || {};
          const isVegan = !kw.status || kw.status === "vegan";
          const labelDe = isVegan
            ? (VEGAN_KW_DE[kw.label] || kwDE.labelDe || kw.label)
            : (kwDE.labelDe || kw.label);
          const finding = {
            labelEn:  kw.label,
            labelDe:  labelDe,
            status:   kw.status || "vegan",
            reasonEn: kw.reason || "Plant-based / vegan",
            reasonDe: kwDE.reasonDe || kw.reason || "Pflanzlich / vegan",
            found:    foundTerm,
          };
          if (kw.status && kw.status !== "vegan") findings.push(finding);
          else veganFindings.push(finding);
        }
      }
    }

    // 1) E-numbers
    const eRegex = /\be[\s\-]?(\d{3}[a-z]?)\b/gi;
    let match;
    while ((match = eRegex.exec(analysisText)) !== null) {
      const code = "E" + match[1].toUpperCase();
      const info = data.eNumbers[code];
      if (!info) continue;

      const key = "e:" + code;
      if (seenLabels.has(key)) continue;
      seenLabels.add(key);

      const nameDe = info.name;
      const nameEn = E_NAMES_EN[code] || info.name;
      const noteDe = info.note || statusToText_de(info.status);
      const noteEn = (info.note ? (E_NOTES_EN[code] || info.note) : null) || statusToText_en(info.status);

      const finding = {
        labelEn:  `${code} – ${nameEn}`,
        labelDe:  `${code} – ${nameDe}`,
        status:   info.status,
        reasonEn: noteEn,
        reasonDe: noteDe,
        found:    code.toLowerCase(),
      };
      if (info.status === "vegan") veganFindings.push(finding);
      else findings.push(finding);
    }

    // 2) Problematic ingredients
    matchKeywords(data.keywords, "kw:");

    // 3) Safe / vegan ingredients
    matchKeywords(data.veganKeywords || [], "vkw:");

    return { findings, veganFindings, tracesText };
  }

  /* ───────── Image preprocessing ───────── */
  function preprocessImage(img) {
    const MAX = 1800;
    const scale = Math.min(1, MAX / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.round(img.naturalWidth  * scale);
    const h = Math.round(img.naturalHeight * scale);

    const canvas = document.createElement("canvas");
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, w, h);

    const imageData = ctx.getImageData(0, 0, w, h);
    const d = imageData.data;
    const n = w * h;

    const gray = new Uint8Array(n);
    for (let i = 0; i < n; i++) {
      gray[i] = Math.round(0.299 * d[i*4] + 0.587 * d[i*4+1] + 0.114 * d[i*4+2]);
    }
    cachedGray = gray;
    cachedDims = { w, h };

    const threshold = otsuThreshold(gray);
    return { canvas: applyThreshold(gray, w, h, threshold), threshold };
  }

  function applyThreshold(gray, w, h, t) {
    const canvas = document.createElement("canvas");
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext("2d");
    const imageData = ctx.createImageData(w, h);
    const d = imageData.data;
    for (let i = 0; i < gray.length; i++) {
      const v = gray[i] <= t ? 0 : 255;
      d[i*4] = d[i*4+1] = d[i*4+2] = v;
      d[i*4+3] = 255;
    }
    ctx.putImageData(imageData, 0, 0);
    return canvas;
  }

  function otsuThreshold(gray) {
    const hist = new Int32Array(256);
    for (const v of gray) hist[v]++;
    const total = gray.length;
    let sum = 0;
    for (let i = 0; i < 256; i++) sum += i * hist[i];
    let sumB = 0, wB = 0, maxVar = 0, best = 128;
    for (let t = 0; t < 256; t++) {
      wB += hist[t];
      if (!wB) continue;
      const wF = total - wB;
      if (!wF) break;
      sumB += t * hist[t];
      const mB = sumB / wB;
      const mF = (sum - sumB) / wF;
      const variance = wB * wF * (mB - mF) ** 2;
      if (variance > maxVar) { maxVar = variance; best = t; }
    }
    return best;
  }

  /* ───────── E-number lookup ───────── */
  const lookupInput  = $("lookupInput");
  const lookupResult = $("lookupResult");

  lookupInput.addEventListener("input", () => {
    const raw = lookupInput.value.trim().toUpperCase().replace(/^E\s*/, "E").replace(/^(\d)/, "E$1");
    const code = raw.match(/^E\d{3,4}[A-Z]?$/) ? raw : null;
    if (!code) { lookupResult.classList.add("hidden"); return; }

    const info = data.eNumbers[code];
    const S = STRINGS[uiLang];
    lookupResult.classList.remove("hidden", "vegan", "vegetarian", "conditional", "non-vegetarian", "not-found");

    if (!info) {
      lookupResult.classList.add("not-found");
      lookupResult.innerHTML = `<span class="lookup-name">${escapeHtml(code)}</span><p class="lookup-note">${escapeHtml(S.not_in_db)}</p>`;
      return;
    }

    const statusLabels = {
      "vegan":          { text: S.badge_vegan,       badge: "badge-vegan" },
      "vegetarian":     { text: S.badge_vegetarian,  badge: "badge-vegetarian" },
      "conditional":    { text: S.badge_conditional, badge: "badge-conditional" },
      "non-vegetarian": { text: S.badge_non_veg,     badge: "badge-non-vegetarian" },
    };
    const sl = statusLabels[info.status] || { text: info.status, badge: "" };
    const displayName = uiLang === "de" ? info.name : (E_NAMES_EN[code] || info.name);
    const displayNote = uiLang === "de" ? info.note : (E_NOTES_EN[code] || info.note);

    lookupResult.classList.add(info.status);
    lookupResult.innerHTML = `
      <div class="lookup-name">${escapeHtml(code)} – ${escapeHtml(displayName)}</div>
      <span class="lookup-badge ${sl.badge}">${sl.text}</span>
      ${displayNote ? `<p class="lookup-note">${escapeHtml(displayNote)}</p>` : ""}`;
  });

  /* ───────── Helpers ───────── */
  function looksLikeIngredientList(text) {
    const t = text.toLowerCase();
    const commas = (t.match(/,/g) || []).length;
    const hasLabel = /zutaten|inhaltsstoffe|ingredients?|contains?:|contient|contiene|enthält|ingredienti|ingredientes/.test(t);
    const wordCount = t.split(/\s+/).filter(w => w.length > 2).length;
    return commas >= 2 || hasLabel || wordCount >= 8;
  }

  function statusToText_en(status) {
    return {
      "vegan":          "vegan",
      "vegetarian":     "vegetarian, but not vegan",
      "non-vegetarian": "animal-derived",
      "conditional":    "may be plant-based or animal-derived – check with manufacturer",
    }[status] || "";
  }

  function statusToText_de(status) {
    return {
      "vegan":          "vegan",
      "vegetarian":     "vegetarisch, aber nicht vegan",
      "non-vegetarian": "tierischen Ursprungs",
      "conditional":    "kann pflanzlich oder tierisch sein – Hersteller fragen",
    }[status] || "";
  }

  function statusToText(status) {
    return uiLang === "de" ? statusToText_de(status) : statusToText_en(status);
  }

  /* ───────── Render result ───────── */
  function renderResult(findings, veganFindings, rawText, tracesText = "") {
    lastRender = { findings, veganFindings, rawText, tracesText };
    progressSection.classList.add("hidden");
    resultSection.classList.remove("hidden");
    const S = STRINGS[uiLang];

    rawTextEl.textContent = rawText.trim() || S.no_text_detected;

    const hasNonVeg = findings.some(f => f.status === "non-vegetarian");
    const hasVeg    = findings.some(f => f.status === "vegetarian");
    const hasCond   = findings.some(f => f.status === "conditional");

    let kind, emoji, title, summary;
    if (!rawText.trim()) {
      kind = "uncertain"; emoji = "❓";
      title   = S.verdict_no_text;
      summary = S.verdict_no_text_sub;
    } else if (hasNonVeg) {
      kind = "non-veg"; emoji = "🥩";
      title   = S.verdict_non_veg;
      summary = S.verdict_non_veg_sub;
    } else if (hasVeg) {
      kind = "vegetarian"; emoji = "🧀";
      title   = S.verdict_vegetarian;
      summary = S.verdict_veg_sub;
    } else if (hasCond) {
      kind = "uncertain"; emoji = "🤔";
      title   = S.verdict_prob_vegan;
      summary = S.verdict_prob_vegan_sub;
    } else {
      kind = "vegan"; emoji = "🌱";
      title   = S.verdict_vegan;
      summary = S.verdict_vegan_sub;
    }

    verdictEl.className = "verdict " + kind;
    verdictEmoji.textContent = emoji;
    verdictTitle.textContent = title;
    verdictSummary.textContent = summary;

    const looksLikeIngredients = looksLikeIngredientList(rawText);
    if (rawText.trim() && !looksLikeIngredients) {
      warningBanner.textContent = S.warn_not_ingredient;
      warningBanner.classList.remove("hidden");
    } else if (rawText.trim() && looksLikeIngredients && findings.length === 0 && veganFindings.length === 0) {
      warningBanner.textContent = S.warn_no_match;
      warningBanner.classList.remove("hidden");
    } else {
      warningBanner.classList.add("hidden");
    }

    findingsList.innerHTML = "";
    if (findings.length === 0) {
      findingsCard.classList.add("hidden");
    } else {
      findingsCard.classList.remove("hidden");
      // Update heading via data-i18n (already set by applyLang); also set directly for safety
      const h3 = findingsCard.querySelector("h3");
      if (h3) h3.textContent = S.findings_heading;

      const order = { "non-vegetarian": 0, "vegetarian": 1, "conditional": 2 };
      findings.sort((a, b) => (order[a.status] ?? 9) - (order[b.status] ?? 9));
      for (const f of findings) findingsList.appendChild(makeFindingLi(f));
    }

    const veganCard  = $("veganCard");
    const veganList  = $("veganList");
    const veganCount = $("veganCount");
    veganList.innerHTML = "";
    if (veganFindings.length === 0) {
      veganCard.classList.add("hidden");
    } else {
      veganCard.classList.remove("hidden");
      veganCount.textContent = veganFindings.length;
      const safeHeadingSpan = veganCard.querySelector("[data-i18n='safe_heading']");
      if (safeHeadingSpan) safeHeadingSpan.textContent = S.safe_heading;
      for (const f of veganFindings) {
        const li = document.createElement("li");
        li.className = "vegan-item";
        const label = uiLang === "de" ? f.labelDe : f.labelEn;
        li.innerHTML = `<span class="vegan-label">${escapeHtml(label)}</span><span class="vegan-found">"${escapeHtml(f.found)}"</span>`;
        veganList.appendChild(li);
      }
    }

    // Traces section
    const tracesCard = $("tracesCard");
    const tracesEl   = $("tracesText");
    if (tracesText) {
      tracesCard.classList.remove("hidden");
      tracesEl.textContent = tracesText;
    } else {
      tracesCard.classList.add("hidden");
    }

    resultSection.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function makeFindingLi(f) {
    const S = STRINGS[uiLang];
    const label  = uiLang === "de" ? f.labelDe  : f.labelEn;
    const reason = uiLang === "de" ? f.reasonDe : f.reasonEn;
    const li = document.createElement("li");
    li.className = f.status;
    li.innerHTML = `
      <div class="finding-label">
        <span>${escapeHtml(label)}</span>
        <span class="finding-tag tag-${f.status}">${tagText(f.status)}</span>
      </div>
      <p class="finding-reason">${escapeHtml(reason)}</p>
      <p class="finding-found">${escapeHtml(S.found_as)} "${escapeHtml(f.found)}"</p>`;
    return li;
  }

  function tagText(status) {
    const S = STRINGS[uiLang];
    return {
      "non-vegetarian": S.tag_non_veg,
      "vegetarian":     S.tag_veg,
      "conditional":    S.tag_conditional,
    }[status] || status;
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  /* ───────── Apply saved/default language on boot ───────── */
  applyLang(uiLang);
})();
