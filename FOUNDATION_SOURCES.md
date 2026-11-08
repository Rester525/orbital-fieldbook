# Foundation sources and verification

Checked: **2026-11-08**. This audit covers only `foundations.json`, `questions-foundations.json` and `tests/foundations.test.mjs`.

## Post-integration method-specific sources

The general NASA overview is not used alone to support detailed quantitative method claims. These additional bodies were fetched and read on 2026-11-08 (HTTP 200). Lesson-local numbered markers map the four method lessons to their source lists; associated practice items include these same references. Only original explanations and links ship, not the source PDFs or extracted text.

- **Analytic solutions to the maximum and average exoplanet transit depth for common stellar limb darkening laws** — https://arxiv.org/html/1901.01730v2
  - Abstract; §1 Introduction: uniform-brightness stellar circle, square-root depth/radius relation, ingress/egress footnote, and limb-darkening limits
- **The true masses of radial-velocity exoplanets constrained by stability** — https://ar5iv.labs.arxiv.org/html/2608.26880
  - Abstract and §1 Introduction: line-of-sight RV signal proportional to M sin i; minimum mass and unknown inclination. Technical preprint; not a scope authority
- **Microlensing Source — Glossary** — https://www.microlensing-source.org/glossary/
  - Binary Lens Parameters: Mass ratio q, Lens separation s and Projected lens separation; Single Lens Parameters: lens distance and lens mass
- **Microlensing Source — Binary Lenses** — https://www.microlensing-source.org/theory/binary-lenses/
  - Caustics; concluding paragraphs beginning “The expressions derived here depend”: mass ratio and lens-plane positions determine light-curve features
- **Traub & Oppenheimer — Direct Imaging of Exoplanets (2010)** — https://www.amnh.org/content/download/53052/796511/file/DirectImagingChapter.pdf
  - §2.2 Angular Separation and §2.3 Contrast of Planet, printed pp.114–115 / PDF pp.4–5; §1.1 common-motion examples. Historical textbook physics, not current instrument capability or event scope

The UNL transit page failed TLS verification, and publisher-hosted A&A pages returned 403. Successful arXiv/ar5iv renditions and the AMNH-hosted textbook PDF above were read instead; they are not falsely labeled as successful publisher-page retrievals.

The RV sampling prompt now excludes unseen cycles and identifies true extrema. The tardigrade question now requires measured growth or reproduction during exposure, not merely metabolic activity or recovery afterward.

## Final distance–flux citation and rubric alignment

- https://openstax.org/books/astronomy-2e/pages/17-1-the-brightness-of-stars — HTTP 200 body fetched/read 2026-11-08. Opening luminosity/apparent-brightness discussion explicitly derives inverse-square dilution, including twice/three-times distance examples. Added to the radiation lesson and its three distance–flux assessment items.
- `qf-equilibrium-quotient` now explicitly requests the dynamic-equilibrium explanation graded by its third rubric point.
- The JUICE question now has one measurement and one limitation for each of GALA, RIME and J-MAG, matching its prompt rather than accepting only radar limitations.

## Scope and authority

The source of competition scope is the supplied B55/PDF-page-60 mapping, not scientific background pages or this independent app.[28]
All 13 lessons retain `pending_rules_review`; the inherited current official corrections/clarifications check returned HTTP 403. “B55 mapped” is not a current-final certification. Source status `retrieved` means that the science page body was fetched, not that tournament scope is confirmed.

## Retrieval and rights

The extraction tool reported a search-only backend and could not extract URL bodies. Scientific references were independently retrieved with Python requests and parsed with HTMLParser; cited scientific URLs returned HTTP 200 and their relevant bodies/headings were read. No browser automation, paid calls, remote images, packet questions, source exercises, rule-page reproduction or reference-app copying were used.
Original lessons explain scientific relationships in new wording; all teaching values and data tables are synthetic. External publisher prose, images, assessments and diagrams are not bundled. OpenStax pages display reuse restrictions and a CC BY-NC-SA notice at retrieval; an outbound citation is not a blanket redistribution license. Do not import their textbook text or exercises into this app without an appropriate rights review.
Failed route details: guessed NASA Science/JPL and USGS paths initially returned 404 or 403. Successful NASA nasa.gov counterparts and the actual USGS center page replaced those paths. Failed fetches are not cited as read. Some broad NASA pages contain mixed-age mission-status statements; only the specified scientific sections support these lessons, and no current launch-status claim is taken from them.

Also retrieved for background, but not used as shipped lesson anchors: the general macromolecule-synthesis section, the NTRS ice-spectra report abstract (not its full report), and NASA’s broad Mars facts page.[4][12][30]

## Claim-to-source audit

### NASA — How We Find and Classify Exoplanets
**Locator:** Radial Velocity: Reading the Wobble; Transits: Planets Found in Dips in Light; Gravitational Microlensing; The Rise of Direct Imaging; Coronagraph.
Four detection signals: recurring dimming, stellar line shifts, gravitational magnification anomalies, and separately recorded companion light. The section on transit spectroscopy supports characterization rather than adding a fifth required detection method.[1]
**Access:** HTTP 200; body and relevant heading/paragraph inspected.

### ESA — Life on exoplanets?
**Locator:** Choosing the right exoplanet; Looking from a distance; Spectra sleuths; So, you think you found a biosignature; What is life?.
Habitable-zone membership does not establish habitability or life. Spectral attribution depends on context and overlapping features; terrestrial extremophiles motivate, but do not establish, extraterrestrial habitats.[3]
**Access:** HTTP 200; body and relevant heading/paragraph inspected.

### NASA — The Habitable Zone
**Locator:** Fast facts: What is the Habitable Zone?; Where Are We Looking for Life, and Why?.
The habitable zone is a surface-liquid-water screening concept, not a declaration that an orbiting world has liquid or life.[2]
**Access:** HTTP 200; body and relevant heading/paragraph inspected.

### OpenStax Biology 2e — 22.3 Prokaryotic Metabolism
**Locator:** The Ways in Which Prokaryotes Obtain Energy; The Ways in Which Prokaryotes Obtain Carbon; Table 22.3.
Energy source, electron donor and carbon source are distinct classification axes. Inorganic-donor chemical energy with inorganic carbon corresponds to chemolithoautotrophy.[5]
**Access:** HTTP 200; body and relevant heading/paragraph inspected.

### OpenStax University Physics Volume 1 — 13.1 Newton’s Law of Universal Gravitation
**Locator:** Newton’s Law of Universal Gravitation; inverse-square force equation.
Gravitational force depends on both masses and inverse square of center-to-center separation.[6]
**Access:** HTTP 200; body and relevant heading/paragraph inspected.

### OpenStax Chemistry 2e — 12.5 Collision Theory
**Locator:** Activation Energy and the Arrhenius Equation.
Activation energy and a frequency/orientation factor enter the exponential temperature dependence of a rate constant.[7]
**Access:** HTTP 200; body and relevant heading/paragraph inspected.

### OpenStax Chemistry 2e — 13.2 Equilibrium Constants
**Locator:** Reaction quotient definition; Predicting the Direction of Reaction.
Q compares products and reactants with stoichiometric powers; comparing Q with K predicts net reaction direction, not reaction speed.[8]
**Access:** HTTP 200; body and relevant heading/paragraph inspected.

### ESA — Tiny animals survive exposure to space
**Locator:** Opening account of TARDIS; paragraphs beginning “Our principle finding” and “That the water bears survived”.
ESA describes water-bear survival following space exposure. The lesson deliberately separates recovery from continuous growth or reproduction during exposure.[9]
**Access:** HTTP 200; body and relevant heading/paragraph inspected.

### NASA — Asteroid Bennu Sample Reveals Mix of Life’s Ingredients
**Locator:** Paragraphs beginning “Detailed in the Nature Astronomy paper”, “These building blocks”, and “Reporting in the journal Nature”.
Returned small-body material contains organic building blocks and salts interpreted as a record of earlier aqueous processing. Neither building blocks nor evaporites establish life.[10]
**Access:** HTTP 200; body and relevant heading/paragraph inspected.

### NASA — Perseverance Science Highlights
**Locator:** Sampled Ancient Lakebeds; Revealed Complex History of Water.
Sediment layers and delta/flood interpretations provide geological evidence of past water activity, not a measurement of present organisms.[11]
**Access:** HTTP 200; body and relevant heading/paragraph inspected.

### OpenStax Biology 2e — 3.2 Carbohydrates
**Locator:** Molecular Structures; Monosaccharides; Polysaccharides.
Carbohydrates include sugars and larger polymers with energy, storage and structural roles.[13]
**Access:** HTTP 200; body and relevant heading/paragraph inspected.

### OpenStax Biology 2e — 3.3 Lipids
**Locator:** Fats and Oils; Phospholipids.
Fats store energy and phospholipids contribute to membranes; lipids are a diverse group rather than one uniform polymer class.[14]
**Access:** HTTP 200; body and relevant heading/paragraph inspected.

### OpenStax Biology 2e — 3.4 Proteins
**Locator:** Types and Functions of Proteins; Amino Acids.
Proteins are amino-acid polymers whose structures enable functions including catalysis and transport.[15]
**Access:** HTTP 200; body and relevant heading/paragraph inspected.

### OpenStax Biology 2e — 3.5 Nucleic Acids
**Locator:** DNA and RNA.
Nucleic acids are nucleotide polymers; genetic bases alone are not complete DNA or RNA molecules.[16]
**Access:** HTTP 200; body and relevant heading/paragraph inspected.

### OpenStax Chemistry 2e — 9.2 Ideal Gas Law
**Locator:** The Ideal Gas Law; Pressure and Temperature: Amontons’s Law.
PV = nRT and fixed-variable gas-law ratios require absolute temperature and consistent units.[17]
**Access:** HTTP 200; body and relevant heading/paragraph inspected.

### OpenStax University Physics Volume 1 — 13.3 Gravitational Potential Energy and Total Energy
**Locator:** Gravitational Potential Energy beyond Earth; Escape velocity; Energy and gravitationally bound objects.
U is negative when zero is assigned at infinity; total energy distinguishes bound motion, and escape requires enough kinetic energy to reach zero total energy.[18]
**Access:** HTTP 200; body and relevant heading/paragraph inspected.

### OpenStax University Physics Volume 1 — 13.5 Kepler’s Laws of Planetary Motion
**Locator:** Kepler’s First Law; Kepler’s Second Law; Kepler’s Third Law.
Ellipses with a focus at the central body, equal swept areas in equal times, and the period–semimajor-axis relation are separate laws.[19]
**Access:** HTTP 200; body and relevant heading/paragraph inspected.

### OpenStax University Physics Volume 1 — 13.6 Tidal Forces
**Locator:** Lunar Tides; tidal force as a difference in gravitational attraction.
Tides arise from differences in gravitational attraction across a body; deformation and dissipation connect tidal forcing to heat.[20]
**Access:** HTTP 200; body and relevant heading/paragraph inspected.

### OpenStax Astronomy 2e — 5.2 The Electromagnetic Spectrum
**Locator:** Radiation and Temperature; Radiation Laws (Wien’s law and Stefan–Boltzmann law).
Wavelength-form Wien displacement and the Stefan–Boltzmann fourth-power relation connect ideal blackbody spectra to temperature.[21]
**Access:** HTTP 200; body and relevant heading/paragraph inspected.

### OpenStax Astronomy 2e — 5.6 The Doppler Effect
**Locator:** Motion Affects Waves; Color Shifts; Doppler wavelength-shift equation.
Relative line-of-sight motion shifts spectral features; the small-speed wavelength relation supplies signed velocity.[22]
**Access:** HTTP 200; body and relevant heading/paragraph inspected.

### NASA Earth Observatory — Climate and Earth’s Energy Budget
**Locator:** Earth’s Energy Budget; The Atmosphere’s Energy Budget; Effect on Surface Temperature.
Incoming, reflected, absorbed and emitted radiation must be distinguished. Atmospheric energy exchange means a simple effective equilibrium temperature is not surface temperature.[23]
**Access:** HTTP 200; body and relevant heading/paragraph inspected.

### OpenStax Biology 2e — 2.2 Water
**Locator:** Water’s Polarity; Water’s States: Gas, Liquid, and Solid; Water’s High Heat Capacity.
Polarity, hydrogen bonding, solvent behavior and heat capacity explain why liquid water matters to familiar cellular chemistry.[24]
**Access:** HTTP 200; body and relevant heading/paragraph inspected.

### USGS — Gas Hydrates: Primer
**Locator:** Gas Hydrates - Primer; paragraph beginning “At the molecular level”; text label “Where Does Methane Hydrate Occur?”.
Gas hydrates are crystalline water cages with trapped guest molecules; stable conditions and a sufficient guest supply are both needed.[25]
**Access:** HTTP 200; body and relevant heading/paragraph inspected.

### NASA — Why Comets Are Like Deep Fried Ice Cream
**Locator:** Paragraphs beginning “In the new study” and “Gudipati and Lignell”; laboratory crystallization experiment.
Laboratory warming of amorphous ice mixtures produced crystalline structure and segregation of organic material. The lesson does not extrapolate a universal natural-comet interior from this experiment.[26]
**Access:** HTTP 200; body and relevant heading/paragraph inspected.

### NASA — Lab Work Digs Into Gullies Seen on Giant Asteroid Vesta
**Locator:** Re-creating Vesta; laboratory pure-water versus brine comparison (not confirmation of natural brines).
Controlled low-pressure experiments compare pure-water freezing with longer-lived brine flow. This supports a mechanism, not confirmed natural deposits on the studied body.[27]
**Access:** HTTP 200; body and relevant heading/paragraph inspected.

### Science Olympiad 2027 Division B Rules — Solar System
**Locator:** B55 / PDF page 60, clauses 1, 2.a–c, 3 introduction, 4.a–c; supplied verified rule map, current corrections check blocked.
The supplied curriculum/dossier maps event orientation, material limits, test emphasis and scoring to B55. This worker did not independently refetch the secured manual; the inherited official-update check was blocked.[28]
**Access:** Supplied verified map; current update check pending.

### OpenStax Chemistry 2e — 13.3 Shifting Equilibria: Le Châtelier’s Principle
**Locator:** Effect of a Catalyst.
A catalyst lowers barriers for both reaction directions and accelerates equilibration without changing K at fixed temperature.[29]
**Access:** HTTP 200; body and relevant heading/paragraph inspected.

### OpenStax Chemistry 2e — 11.4 Colligative Properties
**Locator:** Freezing Point Depression; Osmosis and Osmotic Pressure of Solutions.
Dissolved particles change freezing behavior and can impose osmotic stress. Toy thresholds in practice are explicitly supplied, not universal constants.[31]
**Access:** HTTP 200; body and relevant heading/paragraph inspected.

### NASA — Ocean Worlds
**Locator:** Jupiter’s Moon Europa; Saturn’s Moon Enceladus; Ancient Mars (mechanisms only, not dated mission status).
Subsurface reservoirs and tidal heating illustrate why a cold surface need not exclude interior liquid. Only the physical mechanisms are used; stale mission-status prose is not carried into this app.[32]
**Access:** HTTP 200; body and relevant heading/paragraph inspected.

## Coverage and original question blueprint

| Lesson | Exact clauses | Practice IDs |
|---|---|---|
| `foundation-orientation` | `1`, `2.a–c`, `3 intro`, `4.a–c` | `qf-materials`, `qf-score`, `qf-scope-review` |
| `foundation-habitability` | `1`, `3.b.i` | `qf-conditions`, `qf-retention`, `qf-disequilibrium-life` |
| `foundation-evidence` | `3 intro`, `3.b.ii` | `qf-morphology`, `qf-spectrum`, `qf-delivery` |
| `foundation-biomolecules` | `3.b.iii` | `qf-families`, `qf-nucleobase` |
| `foundation-water` | `3.b.iii` | `qf-water-forms`, `qf-ice-warming`, `qf-brine-threshold` |
| `foundation-extremophiles` | `3.b.iii`, `3.b.i` | `qf-chemo-label`, `qf-survival`, `qf-energy-carbon` |
| `method-transits` | `3.b.iv`, `3 intro` | `qf-transit-table`, `qf-transit-no-dip` |
| `method-radial-velocity` | `3.b.iv`, `3.b.vi(1)`, `3 intro` | `qf-rv-table`, `qf-rv-shift` |
| `method-microlensing` | `3.b.iv`, `3 intro` | `qf-microlensing-table`, `qf-microlensing-period` |
| `method-direct-imaging` | `3.b.iv`, `3 intro` | `qf-imaging-table`, `qf-imaging-followup` |
| `math-radiation` | `3.b.vi(1)` | `qf-inverse-square`, `qf-albedo-average`, `qf-stefan`, `qf-wien`, `qf-equilibrium-scale`, `qf-radiation-graph` |
| `math-gravity` | `3.b.vi(2)` | `qf-gravity-force`, `qf-energy-total`, `qf-kepler-period`, `qf-kepler-laws`, `qf-escape`, `qf-tide-scale` |
| `math-chemistry` | `3.b.vi(3)` | `qf-gas-pressure`, `qf-gas-substitution`, `qf-arrhenius-factor`, `qf-arrhenius-graph`, `qf-equilibrium-quotient`, `qf-catalyst`, `qf-rates-vs-equilibrium` |

## Answer-key reasoning review

Author review checked every MCQ for one best answer and plausible distractors; this is not a claim of an independent human educator review. The test contains a separate expected-answer-text fixture for all MCQs so a moved answer index cannot silently change the key. Written items contain point-bearing criteria rather than an auto-grading claim; equivalent scientifically correct wording should be accepted. For partial credit, award each numbered criterion independently; no unsupported conclusion earns a reasoning point merely for using a vocabulary word.

| MCQ ID | Correct option (1-based) | Decisive reasoning |
|---|---|---|
| `qf-materials` | 2 | Two sheets used on both sides provide four faces |
| `qf-scope-review` | 4 | The lesson is mapped to the supplied manual, but a blocked corrections check cannot establish that no updates exist |
| `qf-conditions` | 3 | Habitat B combines evidence for a persistent liquid reservoir, an energy source and chemical exchange |
| `qf-disequilibrium-life` | 2 | Disequilibrium can supply usable chemical energy, but transport, geological sources, light-driven chemistry or slow kinetics can also maintain it |
| `qf-spectrum` | 3 | The shared 2.0 μm band is ambiguous, but the 3.0 μm band and absent 4.0 μm band favor X under the stated model |
| `qf-nucleobase` | 2 | A nucleobase is a component of nucleotides, not a complete nucleotide chain or organism |
| `qf-ice-warming` | 4 | Crystallization can rearrange solid water and change the distribution of trapped compounds |
| `qf-brine-threshold` | 2 | At −6 °C the temperature is below the pure-water freezing threshold but above this brine’s threshold |
| `qf-chemo-label` | 1 | The energy is chemical, the electron donor inorganic and the carbon source inorganic carbon |
| `qf-transit-no-dip` | 3 | A planet can fail to transit because its orbit is not aligned with our line of sight |
| `qf-rv-shift` | 2 | The fractional shift is 0.004/400 = 0.00001, giving 3 km/s |
| `qf-microlensing-period` | 4 | The anomaly timescale reflects the lensing geometry and motion through the magnification pattern |
| `qf-imaging-table` | 2 | Candidate B meets both thresholds: 0.30 arcsecond exceeds 0.25 and 0.00003 exceeds 0.00002 |
| `qf-inverse-square` | 3 | Flux scales as inverse distance squared: 720/3² = 80 W/m² |
| `qf-stefan` | 4 | With equal areas and blackbody emissivity, emitted power scales as T⁴ |
| `qf-equilibrium-scale` | 3 | The flux becomes 1/16 as large, so temperature becomes (1/16)^(1/4) = 1/2 as large: 120 K |
| `qf-gravity-force` | 1 | Newton’s law gives force proportional to 1/r² at fixed masses |
| `qf-kepler-period` | 4 | P² = 9³ = 729; P = √729 = 27 years |
| `qf-escape` | 2 | The escape speed is √(2 × 18) = √36 = 6 m/s |
| `qf-gas-pressure` | 2 | At fixed amount and volume, P/T is constant |
| `qf-arrhenius-factor` | 3 | The supplied exponential factor already includes the activation-energy and temperature dependence |
| `qf-catalyst` | 4 | A catalyst lowers kinetic barriers for a pathway and accelerates both directions |

Written-answer checks: morphology and spectra separate observation from inference; delivery separates ingredients from organisms; molecular-family rubrics demand function as well as naming; water-form comparisons distinguish phase, order and guests; extremophile rubrics distinguish survival from activity. Each method has a distinct data task with its own observable and limitation. Numerical rubrics require units, stated assumptions and the right physical quantity, not a bare number.

## Numerical and schema verification

- 44 original questions: 22 MCQ and 22 written. There are 10 data-kind tasks, including one per detection method, and 19 numeric_check records. Some non-data-kind comparison items also have tables.
- All numeric_check expressions contain only numbers, `+ - * / **`, whitespace and parentheses. A bounded recursive-descent parser evaluates them without eval, Function, global identifiers or property access. It rejects malformed tokens, non-finite results and code-like input.
- Computation tests independently derive transit depth/period, radial-velocity amplitude, microlensing residual and imaging-threshold selection from their actual tables. The numerical expression must match its expected value and the expected value must appear in the explanation.
- Worked lesson arithmetic is also recomputed: inverse-square/fourth-root scaling, Doppler, albedo averaging, Wien/Stefan–Boltzmann, energies, Kepler, escape speed, tides, gas ratios, Arrhenius factor and quotient examples.
- Schema tests cover unique IDs, exact four lower-case method titles, exact non-named B55 coverage, lesson links, option indexes, written rubrics, rectangular safe data tables, citation objects, substantial lesson sections, evidence fields and season/pending-review status.
- Test-first evidence: the initial lesson test failed because foundations.json was absent, then passed after authoring. The question-bank test failed because questions-foundations.json was absent, then passed after authoring. A later textual assertion caught Unicode minus versus ASCII minus in a correct negative energy key; only the comparison normalization changed.
- Verified final content run: **5 tests passed, 0 failed** with `node --test tests/foundations.test.mjs`. Strict bibliography verification also returned `citations OK`.
- Re-run: `node --test tests/foundations.test.mjs`. UI rendering, screen-reader behavior and final cross-worker integration are not verified by this content test suite.

## Model boundaries

Transit calculations use a uniform star disk, an opaque planet and the stated overlap geometry. The app’s model assumes circular orbits; the orbital lesson separately teaches all three Kepler laws, including eccentric orbits. Radius-squared transit depth is used only for full overlap, not grazing cases. Equilibrium temperature is a full-redistribution radiative blackbody model, not surface temperature or proof of liquid water. Every numeric stimulus is hand-solvable from the supplied inputs.

## Sources

[1] https://science.nasa.gov/exoplanets/how-we-find-and-characterize — How We Find and Characterize - NASA Science Explore Search News & Events News & Events Recently Published Vid
[2] https://science.nasa.gov/exoplanets/habitable-zone — The Habitable Zone - NASA Science Explore Search News & Events News & Events Recently Published Video Series
[3] https://www.esa.int/Science_Exploration/Space_Science/Exoplanets/Life_on_exoplanets — Life on exoplanets? Loading languages Select your language is your current language. Based on your location,
[4] https://openstax.org/books/biology-2e/pages/3-1-synthesis-of-biological-macromolecules — 3.1 Synthesis of Biological Macromolecules - Biology 2e | OpenStax
[5] https://openstax.org/books/biology-2e/pages/22-3-prokaryotic-metabolism — 22.3 Prokaryotic Metabolism - Biology 2e | OpenStax
[6] https://openstax.org/books/university-physics-volume-1/pages/13-1-newtons-law-of-universal-gravitation — 13.1 Newton's Law of Universal Gravitation - University Physics Volume 1 | OpenStax
[7] https://openstax.org/books/chemistry-2e/pages/12-5-collision-theory — 12.5 Collision Theory - Chemistry 2e | OpenStax
[8] https://openstax.org/books/chemistry-2e/pages/13-2-equilibrium-constants — 13.2 Equilibrium Constants - Chemistry 2e | OpenStax
[9] https://www.esa.int/articles/about-us/directorates/human-and-robotic-exploration/tiny-animals-survive-exposure-to-space — Tiny animals survive exposure to space Loading languages Select your language is your current language. Based
[10] https://www.nasa.gov/news-release/nasas-asteroid-bennu-sample-reveals-mix-of-lifes-ingredients — NASA’s Asteroid Bennu Sample Reveals Mix of Life’s Ingredients - NASA Explore Search News & Events News & Eve
[11] https://science.nasa.gov/mission/mars-2020-perseverance/science-highlights — Perseverance Science Highlights - NASA Science Explore Search News & Events News & Events Recently Published
[12] https://ntrs.nasa.gov/citations/19930004472 — Experimental studies of the far-infrared spectra of cosmic-type ices - NASA Technical Reports Server (NTRS) N
[13] https://openstax.org/books/biology-2e/pages/3-2-carbohydrates — 3.2 Carbohydrates - Biology 2e | OpenStax
[14] https://openstax.org/books/biology-2e/pages/3-3-lipids — 3.3 Lipids - Biology 2e | OpenStax
[15] https://openstax.org/books/biology-2e/pages/3-4-proteins — 3.4 Proteins - Biology 2e | OpenStax
[16] https://openstax.org/books/biology-2e/pages/3-5-nucleic-acids — 3.5 Nucleic Acids - Biology 2e | OpenStax
[17] https://openstax.org/books/chemistry-2e/pages/9-2-relating-pressure-volume-amount-and-temperature-the-ideal-gas-law — 9.2 Relating Pressure, Volume, Amount, and Temperature: The Ideal Gas Law - Chemistry 2e | OpenStax
[18] https://openstax.org/books/university-physics-volume-1/pages/13-3-gravitational-potential-energy-and-total-energy — 13.3 Gravitational Potential Energy and Total Energy - University Physics Volume 1 | OpenStax
[19] https://openstax.org/books/university-physics-volume-1/pages/13-5-keplers-laws-of-planetary-motion — 13.5 Kepler's Laws of Planetary Motion - University Physics Volume 1 | OpenStax
[20] https://openstax.org/books/university-physics-volume-1/pages/13-6-tidal-forces — 13.6 Tidal Forces - University Physics Volume 1 | OpenStax
[21] https://openstax.org/books/astronomy-2e/pages/5-2-the-electromagnetic-spectrum — 5.2 The Electromagnetic Spectrum - Astronomy 2e | OpenStax
[22] https://openstax.org/books/astronomy-2e/pages/5-6-the-doppler-effect — 5.6 The Doppler Effect - Astronomy 2e | OpenStax
[23] https://science.nasa.gov/earth/earth-observatory/climate-and-earths-energy-budget — Climate and Earth’s Energy Budget - NASA Science Explore Search News & Events News & Events Recently Publishe
[24] https://openstax.org/books/biology-2e/pages/2-2-water — 2.2 Water - Biology 2e | OpenStax
[25] https://www.usgs.gov/centers/whcmsc/science/gas-hydrates-primer — Gas Hydrates - Primer | U.S. Geological Survey Skip to main content An official website of the United States
[26] https://www.nasa.gov/solar-system/why-comets-are-like-deep-fried-ice-cream — Why Comets Are Like Deep Fried Ice Cream - NASA Explore Search News & Events News & Events News Rel
[27] https://www.nasa.gov/missions/dawn/lab-work-digs-into-gullies-seen-on-giant-asteroid-vesta-by-nasas-dawn — Lab Work Digs Into Gullies Seen on Giant Asteroid Vesta by NASA’s Dawn - NASA Explore Search News &
[28] https://www.soinc.org/sites/default/files/uploaded_files/Science_Olympiad_Div_B_Rules_2027_for_Web_Secured.pdf — Science Olympiad 2027 Division B Rules — Solar System
[29] https://openstax.org/books/chemistry-2e/pages/13-3-shifting-equilibria-le-chateliers-principle — 13.3 Shifting Equilibria: Le Châtelier’s Principle - Chemistry 2e | OpenStaxSkip to Conten
[30] https://science.nasa.gov/mars/facts — Mars: Facts - NASA Science Explore Search News & Events News & Events Recently Published
[31] https://openstax.org/books/chemistry-2e/pages/11-4-colligative-properties — 11.4 Colligative Properties - Chemistry 2e | OpenStaxSkip to ContentGo to accessibility pa
[32] https://science.nasa.gov/solar-system/ocean-worlds — Ocean Worlds: Water in the Solar System and Beyond - NASA Science Explore Search News & E
