# Named-content source ledger

## Delivered content and verification

- Exact named coverage: 9 worlds, 3 systems and 16 missions, in curriculum order.
- `public/data/worlds.json`: 12 lessons; `public/data/missions.json`: 16 lessons.
- `public/data/questions-worlds.json`: 18 questions; `public/data/questions-missions.json`: 22 questions. Total: 28 written reasoning questions, one per lesson, plus 12 comparison MCQs with numeric answer indices.
- Lesson section prose totals 6,092 whitespace-delimited words, excluding summaries, evidence chains, teach-backs and questions. Every lesson has three distinct explanatory sections and a tailored five-part evidence chain.
- 37 successful page retrieval records are logged below; 36 distinct retrieved URLs are actually cited. The additional MAVEN instrument-footage page was inspected but not needed in the shipped citations. A page's updated date is not necessarily its scientific publication date.
- Source-reference URLs and titles were programmatically matched to the successful request results. Every explanatory section's local citation markers were checked against that lesson's source list. Every numeric MCQ key was reviewed against the displayed answer and explanation.
- `tests/named-content.test.mjs` was created first and produced 4 failures because the content files did not yet exist. After authoring, its 4 tests passed. It checks exact lists, substantive section lengths, evidence fields, source metadata and ledger membership, written-question coverage, comparison keys, counts and citation-marker bounds.
- The tests verify structure and traceability, not independent peer review of every scientific interpretation. The scientific explanations were reviewed against the fetched passages; planned-measurement scenarios remain explicitly hypothetical.

Retrieved 2026-11-08 using requests and HTMLParser; no browser automation. HTTP 200 alone is not sufficient: titles, headings and relevant body passages were read before use. Source references below identify specific pages, not generic NASA/ESA homepages. All lesson and question prose is newly authored; no rule, packet or examination text is reproduced. Inline [n] within a lesson refers to its own source_refs order. Questions inherit those references.

## Scope and limits

All entries use pending_rules_review: exact B55 names and clause IDs were mapped from the supplied curriculum, but this build’s official updates check was blocked (HTTP 403, reported by the parent build). This agent did not independently clear that gate. Science retrieval is separate from rule verification.

Historical mission-design pages support instrument functions, not current schedules or claims of achieved results. Planned measurements are labeled as such. No launch forecast or mutable operational status is assessed. LHS 1140 oceans/atmospheres and all extraterrestrial life remain unconfirmed here. Conservative Mars text deliberately does not repeat the general facts page’s dated seasonal-brine assertion; Titan ocean wording remains model-based.

## Post-integration science review

A separate read-only reviewer found no incorrect MCQ indexes or numeric keys, but identified the 67P water paragraph as incomplete. The parent fetched and read the newer NASA article below, then revised the lesson to distinguish early high D/H findings from a later dust-sensitive reanalysis. Similarity reopens possible cometary delivery; it does not establish the fraction of Earth's water delivered. This review does not clear the official-rules gate or replace mentor review.

### 67P water reanalysis
- URL: https://science.nasa.gov/solar-system/comets/nasa-led-team-links-comet-water-to-earths-oceans/
- Retrieved title: NASA-Led Team Links Comet Water to Earth’s Oceans
- Retrieved: 2026-11-08; HTTP 200; requests + HTMLParser; relevant body read.
- Locator: opening finding; more than 16,000 Rosetta measurements; dust-linked isotope ratios; dried dust in outer coma. Page last updated February 11, 2025.
- Supports: sampling-dependent D/H measurements and revised Earth-water comparison, not proof of cometary delivery amount or life.

## Specific Ganymede auroral evidence

- URL: https://science.nasa.gov/missions/hubble/nasas-hubble-observations-suggest-underground-ocean-on-jupiters-largest-moon/
- HTTP 200 body retrieved and read 2026-11-08; March 12, 2015 report: paragraph beginning “If a saltwater ocean were present”; modeled rocking reduced to 2° versus 6° without ocean.
- Added to Ganymede lesson and associated question; section and evidence markers point to the direct report.

## Retrieval ledger

### venus
- URL: https://science.nasa.gov/venus/venus-facts/
- Retrieved title: Venus: Facts - NASA Science
- Status: HTTP 200; content checked 2026-11-08.
- Headings observed: Our Solar System; Venus Facts; Introduction; Namesake; Potential for Life; Size and Distance; Orbit and Rotation; Moons; How Zoozve Got Its Name; Rings; Formation; Structure; Surface; Atmosphere; Magnetosphere; Discover More Topics From NASA; National Aeronautics and Space Administration; Follow NASA
- Source date labels: Oct 15, 2026

### mars
- URL: https://science.nasa.gov/mars/facts/
- Retrieved title: Mars: Facts - NASA Science
- Status: HTTP 200; content checked 2026-11-08.
- Headings observed: Mars Facts; Introduction; Namesake; Potential for Life; Size and Distance; Orbit and Rotation; Moons; Rings; Formation; Structure; Surface; A Very Large Canyon; The Largest Volcano; Water on Mars; Atmosphere; Magnetosphere; NASA Launches Twin Satellites to Investigate Mars' Space Weathe; r; Discover More Topics From NASA; Mars Exploration: Science Goals; Mars 2020: Perseverance Rover; Mars Science Laboratory: Curiosity Rover; Mars Exploration; National Aeronautics and Space Administration
- Source date labels: Jul 10, 2026

### ganymede
- URL: https://science.nasa.gov/jupiter/jupiter-moons/ganymede/facts/
- Retrieved title: Ganymede: Facts - NASA Science
- Status: HTTP 200; content checked 2026-11-08.
- Headings observed: Jupiter's Moons; Ganymede Facts; Contents; Introduction; Discovery and Name; Potential for Life; Size and Distance; Orbit and Rotation; Moons; Rings; Formation; Structure; Surface; Atmosphere; Magnetosphere; Pop Culture; Learn More; Jupiter's Moons; Jupiter; Jupiter Resources; Juno Mission; Galileo Mission; Discover More Topics From NASA; National Aeronautics and Space Administration
- Source date labels: Apr 25, 2025

### europa
- URL: https://science.nasa.gov/jupiter/jupiter-moons/europa/
- Retrieved title: Europa - NASA Science
- Status: HTTP 200; content checked 2026-11-08.
- Headings observed: Europa; Facts About Europa; Exploring Europa; Europa Multimedia; Eyes on the Solar System: Europa; Europa News; Learn More; Europa Clipper Website; NASA Photojournal: Europa; Discover More Topics From NASA; National Aeronautics and Space Administration; Follow NASA
- Source date labels: Sep 24, 2026

### enceladus
- URL: https://science.nasa.gov/saturn/moons/enceladus/
- Retrieved title: Enceladus - NASA Science
- Status: HTTP 200; content checked 2026-11-08.
- Headings observed: Enceladus; Contents; Overview; Discovery; How Enceladus Got Its Name; Ocean Worlds Resource Package; Discover More Topics From NASA; National Aeronautics and Space Administration; Follow NASA
- Source date labels: Nov 04, 2024

### titan
- URL: https://science.nasa.gov/saturn/moons/titan/facts/
- Retrieved title: Titan: Facts
- Status: HTTP 200; content checked 2026-11-08.
- Headings observed: Saturn's Moons; Titan Facts; Contents; Introduction; Namesake; Potential for Life; Size and Distance; Orbit and Rotation; Structure; Formation; Surface; Atmosphere; Discover More Topics From NASA; National Aeronautics and Space Administration; Follow NASA
- Source date labels: Oct 19, 2026

### makemake
- URL: https://science.nasa.gov/dwarf-planets/makemake/
- Retrieved title: Makemake
- Status: HTTP 200; content checked 2026-11-08.
- Headings observed: Dwarf Planets; Makemake Facts; Introduction; Namesake; Potential for Life; Size and Distance; Orbit and Rotation; Moons; Rings; Formation; Structure; Surface; Atmosphere; Magnetosphere; Discover More Topics From NASA; National Aeronautics and Space Administration; Follow NASA
- Source date labels: Oct 26, 2026

### bennu
- URL: https://science.nasa.gov/solar-system/asteroids/101955-bennu/
- Retrieved title: Bennu - NASA Science
- Status: HTTP 200; content checked 2026-11-08.
- Headings observed: Bennu; About Bennu; Exploring Bennu; Bennu Multimedia; Asteroid and Comet Resources; Latest Asteroid News; More Resources; OSIRIS-REx Mission; Discover More Topics From NASA; National Aeronautics and Space Administration; Follow NASA
- Source date labels: May 12, 2025

### 67p
- URL: https://science.nasa.gov/solar-system/comets/67p-churyumov-gerasimenko/
- Retrieved title: 67P/Churyumov-Gerasimenko - NASA Science
- Status: HTTP 200; content checked 2026-11-08.
- Headings observed: 67P/Churyumov-Gerasimenko; Discovery; Overview; How This Comet Got Its Name; Discover More Topics From NASA; National Aeronautics and Space Administration; Follow NASA
- Source date labels: Nov 03, 2024

### lhscat
- URL: https://science.nasa.gov/exoplanet-catalog/lhs-1140-b/
- Retrieved title: LHS 1140 b - NASA Science
- Status: HTTP 200; content checked 2026-11-08.
- Headings observed: LHS 1140 b; Discover More Topics From NASA; National Aeronautics and Space Administration; Follow NASA
- Source date labels: 2017; Jul 07, 2025

### lhs
- URL: https://science.nasa.gov/blogs/webb/2024/06/05/reconnaissance-of-potentially-habitable-worlds-with-nasas-webb/
- Retrieved title: Reconnaissance of Potentially Habitable Worlds with NASA’s Webb - NASA Science
- Status: HTTP 200; content checked 2026-11-08.
- Headings observed: James Webb Space Telescope; Categories; Reconnaissance of Potentially Habitable Worlds with NASA’s Webb; Categories; More from James Webb Space Telescope; NASA’s James Webb Space Telescope Finds Most Distant Known Galaxy; Webb Researchers Discover Lensed Supernova, Confirm Hubble Tension; National Aeronautics and Space Administration; Follow NASA
- Source date labels: Sep 22, 2026

### venusexpress
- URL: https://www.esa.int/articles/about-us/directorates/science/venus-express/venus-express-orbiter-instruments
- Retrieved title: Venus Express orbiter instruments
- Status: HTTP 200; content checked 2026-11-08.
- Headings observed: Select your language; All languages; Venus Express orbiter instruments; Analyser of Space Plasma and Energetic Atoms (ASPERA); Venus Express Magnetometer (MAG); Planetary Fourier Spectrometer (PFS); Ultraviolet and Infrared Atmospheric Spectrometer (SPICAV/SOIR); Venus Radio Science Experiment (VeRa); Ultraviolet/Visible/Near-Infrared mapping spectrometer (VIRTIS); Venus Monitoring Camera; Media modal; Related links; Venus Express; Venus Express overview; Venus Express science highlights; Venus Express operations; Content; stay updated; ELEVATING THE FUTURE OF EUROPE; Cookie preferences
- Source date labels: No reliable explicit date captured; retrieval date only.

### davinci
- URL: https://science.nasa.gov/mission/davinci/
- Retrieved title: NASA's DAVINCI Mission
- Status: HTTP 200; content checked 2026-11-08.
- Headings observed: DAVINCI; The Mission; DAVINCI Stories; Activities & Multimedia; Discover More Topics From NASA; Perseverance Rover; Parker Solar Probe; Juno; National Aeronautics and Space Administration; Follow NASA
- Source date labels: Jul 14, 2026

### veritas
- URL: https://science.nasa.gov/mission/veritas/
- Retrieved title: VERITAS - NASA Science
- Status: HTTP 200; content checked 2026-11-08.
- Headings observed: VERITAS; Discovering Venus on Iceland; About VERITAS; VERITAS: Exploring the Deep Truths of Venus; Seeking Answers; Borrowing From the Past; Meet the VERITAS Team; VERITAS Firsts; Latest Venus News; Additional Resources; Venus Overview; Venus Facts; 2023 Iceland Field Campaign; Discover More Topics From NASA; Solar System Exploration; DAVINCI; National Aeronautics and Space Administration; Follow NASA
- Source date labels: Jul 14, 2026

### perseverance
- URL: https://science.nasa.gov/mission/mars-2020-perseverance/science-instruments/
- Retrieved title: Perseverance Science Instruments - NASA Science
- Status: HTTP 200; content checked 2026-11-08.
- Headings observed: Mars 2020: Perseverance Rover; Science Instruments; Cameras; Mastcam-Z; Tech Specs; SuperCam; Tech Specs; Spectrometer; SHERLOC; Tech Specs; Planetary Instrument for X-ray Lithochemistry (PIXL); Tech Specs; Environmental Sensors; Mars Environmental Dynamics Analyzer (MEDA); Tech Specs; Mars Oxygen ISRU Experiment (MOXIE); Tech Specs; The Sound of MOXIE at Work on Mars; Radar Imager for Mars' Subsurface Experiment (RIMFAX); Tech Specs; Discover More Topics From NASA; James Webb Space Telescope; Perseverance Rover; Parker Solar Probe
- Source date labels: Oct 27, 2026

### mro
- URL: https://science.nasa.gov/mission/mars-reconnaissance-orbiter/science-instruments/
- Retrieved title: MRO Science Instruments - NASA Science
- Status: HTTP 200; content checked 2026-11-08.
- Headings observed: Mars Reconnaissance Orbiter; Science Instruments; Cameras; High Resolution Imaging Experiment; Tech Specs; Context Camera; Tech Specs; Mars Color Imager; Tech Specs; Spectrometer; Compact Reconnaissance Imaging Spectrometer; Tech Specs; Radiometer; Mars Climate Sounder; Tech Specs; Radar; Shallow Radar; Tech Specs; Engineering Instruments; Electra UHF Communications and Navigation Package; Optical Navigation Camera; Ka-band Telecommunications Experiment Package; Science Facility Experiments; Gravity Field Investigation Package
- Source date labels: Nov 04, 2024

### maven
- URL: https://science.nasa.gov/mission/maven/
- Retrieved title: MAVEN - NASA Science
- Status: HTTP 200; content checked 2026-11-08.
- Headings observed: MAVEN; NASA Says Farewell to MAVEN, Declares End of Mission; Meet the MAVEN Orbiter; Learn More About the MAVEN Mission; MAVEN Stories; MAVEN Science; MAVEN Mission Blog; MAVEN Resources; MAVEN at LASP; Citizen Science Project; MAVEN: 10 Years at Mars; Celebrating 10 Years at Mars with NASA’s MAVEN Mission; Discover More Topics From NASA; Mars Science Laboratory: Curiosity Rover; Mars 2020: Perseverance Rover; Mars Exploration: Science Goals; Mars; National Aeronautics and Space Administration; Follow NASA
- Source date labels: Jun 05, 2026

### galileo
- URL: https://science.nasa.gov/mission/galileo/
- Retrieved title: Galileo - NASA Science
- Status: HTTP 200; content checked 2026-11-08.
- Headings observed: Galileo; Galileo Mission Overview; Galileo Quick Facts; Top 10 Science Results; Galileo End of Mission; Quick Facts; Firsts; Spacecraft; Atmospheric Probe; Mission; Program; Media; Top 10 Science Results; Mission Overview; Launch; Venus and Earth Flybys; High-Gain Antenna; Asteroid Flybys; Comet Shoemaker-Levy 9 Impact into Jupiter; Jupiter Arrival; Descent Probe; Orbital Tour; Extended Missions; How the Spacecraft Worked
- Source date labels: Nov 05, 2024

### clipper
- URL: https://science.nasa.gov/mission/europa-clipper/spacecraft-instruments/
- Retrieved title: Europa Clipper Spacecraft Instruments
- Status: HTTP 200; content checked 2026-11-08.
- Headings observed: Europa Clipper Spacecraft Instruments; Spacecraft Instruments; Cameras; Europa Imaging System (EIS); Europa Thermal Emission Imaging System (E-THEMIS); Spectrometry; Europa Ultraviolet Spectrograph (Europa-UVS); Mapping Imaging Spectrometer for Europa (MISE); Plasma and Magnetic Field; Europa Clipper Magnetometer (ECM); Plasma Instrument for Magnetic Sounding (PIMS); Radar & Gravity; Gravity/Radio Science; Radar for Europa Assessment and Sounding: Ocean to Near-surface (REASON); Chemical Analysis; MAss Spectrometer for Planetary EXploration/Europa (MASPEX); SUrface Dust Analyzer (SUDA); Discover More Topics From NASA; Solar System Exploration; National Aeronautics and Space Administration; Follow NASA
- Source date labels: Jun 26, 2025

### juice
- URL: https://sci.esa.int/web/juice/-/61110-juice-instruments
- Retrieved title: ESA Science & Technology - JUICE's instruments
- Status: HTTP 200; content checked 2026-11-08.
- Headings observed: Navigation; juice; ESA Science & Technology - JUICE's instruments; Asset Publisher; JUICE's instruments; ShortUrl Portlet; https://sci.esa.int/s/84y2jeA; Latest Selection; Latest Selection; Also Available As; Also Available As; Related Images; Related Videos; Related Publications; Related Links; See Also; Documentation; Connect with us; Follow ESA science
- Source date labels: 03 February 2019; 16 May 2023

### cassini
- URL: https://science.nasa.gov/mission/cassini/spacecraft/cassini-orbiter/
- Retrieved title: Cassini Orbiter - NASA Science
- Status: HTTP 200; content checked 2026-11-08.
- Headings observed: Cassini Spacecraft; About the Spacecraft; Cassini Orbiter Instruments; Optical Remote Sensing; Fields, Particles and Waves; Microwave Remote Sensing; Discover More Topics From NASA; National Aeronautics and Space Administration; Follow NASA
- Source date labels: Nov 22, 2024

### dragonfly
- URL: https://science.nasa.gov/mission/dragonfly/
- Retrieved title: Dragonfly
- Status: HTTP 200; content checked 2026-11-08.
- Headings observed: Dragonfly; Soar with Dragonfly; Dragonfly isn’t a mission to detect life — it’s a mission to investigate the chemistry that came before biology here on Earth.; Mission Overview; An Airborne Science Mission Like No Other; Sampling the Surface; Eye on Dragonfly; Dragonfly News; Mission Background; New Frontiers; Mission Team; Learn more; Dragonfly Mission Fact Sheet; Saturn; Saturn's Moons; Dragonfly at APL; Discover More; Saturn and Titan Resources; National Aeronautics and Space Administration; Follow NASA
- Source date labels: Oct 29, 2026

### osiris
- URL: https://science.nasa.gov/mission/osiris-rex/
- Retrieved title: NASA's OSIRIS-REx Mission to Asteroid Bennu
- Status: HTTP 200; content checked 2026-11-08.
- Headings observed: OSIRIS-REx; Mission Overview; OSIRIS-REx Full Mission Gallery; Explore OSIRIS-APEX; Discover More Topics From NASA; National Aeronautics and Space Administration; Follow NASA
- Source date labels: Sep 30, 2026

### rosetta
- URL: https://sci.esa.int/web/rosetta/-/35061-instruments
- Retrieved title: ESA Science & Technology - Orbiter Instruments
- Status: HTTP 200; content checked 2026-11-08.
- Headings observed: Navigation; rosetta; ESA Science & Technology - Orbiter Instruments; Asset Publisher; Orbiter Instruments; Introduction; Instruments In Brief; Alice; CONSERT; COSIMA; GIADA; MIDAS; MIRO; OSIRIS; ROSINA; RPC; RSI; VIRTIS; Alice: Ultraviolet Imaging Spectrometer; Science Objectives; Instrument Description; Rosetta Blog articles; CONSERT: Comet Nucleus Sounding Experiment by Radiowave Transmission; Science Objectives
- Source date labels: 20 May 2022

### kepler
- URL: https://science.nasa.gov/mission/kepler/
- Retrieved title: Kepler / K2 - NASA Science
- Status: HTTP 200; content checked 2026-11-08.
- Headings observed: Kepler / K2; Contents; Overview; ‘Planets are Everywhere’; K2; Legacy; Learn More; 'Light Leads the Way'; Discoveries Dashboard; Kepler/K2; Kepler/K2 Stories; Discover More Topics From NASA; Perseverance Rover; James Webb Space Telescope; Parker Solar Probe; Juno; National Aeronautics and Space Administration; Follow NASA
- Source date labels: Jan 05, 2026

### roman
- URL: https://science.nasa.gov/mission/roman-space-telescope/exoplanets/
- Retrieved title: Exoplanets - NASA Science
- Status: HTTP 200; content checked 2026-11-08.
- Headings observed: Exoplanets; Wrinkles in Space-time; Direct Imaging; Microlensing; Direct Imaging; Transit Method; Featured News; NASA Exoplanet Exploration; National Aeronautics and Space Administration; Follow NASA
- Source date labels: Aug 23, 2026

### trappist
- URL: https://science.nasa.gov/universe/exoplanets/seven-rocky-trappist-1-planets-may-be-made-of-similar-stuff/
- Retrieved title: Seven Rocky TRAPPIST-1 Planets May Be Made of Similar Stuff - NASA Science
- Status: HTTP 200; content checked 2026-11-08.
- Headings observed: Seven Rocky TRAPPIST-1 Planets May Be Made of Similar Stuff; Share; Details; Related Terms; Explore More; Suspected Second-generation Planet Solves NASA Hubble Cold Case; Newfound ‘Baby’ Planet Smashes Record for Youngest Known World; 9 Things to Know About NASA’s Nancy Grace Roman Space Telescope; Discover More Topics From NASA; National Aeronautics and Space Administration; Follow NASA
- Source date labels: Oct 28, 2024

### trappistzone
- URL: https://science.nasa.gov/universe/exoplanets/10-things-all-about-trappist-1-2/
- Retrieved title: 10 Things: All About TRAPPIST-1 - NASA Science
- Status: HTTP 200; content checked 2026-11-08.
- Headings observed: 10 Things: All About TRAPPIST-1; Contents; 1) First we thought there were three; 2) ...then we looked at the atmospheres of two; 3) ...but actually there were seven.; 4) The farthest one could be icy; 5) They are likely older than our solar system; 6) They are mostly made of rock; 7) …and that is reinforced by looking for atmospheres.; 8) The planets may appear like moons in each other's skies; 9) We imagine them based on real data; 10) Learn more in our Facebook Live; Share; Details; Related Terms; Explore More; Suspected Second-generation Planet Solves NASA Hubble Cold Case; Newfound ‘Baby’ Planet Smashes Record for Youngest Known World; 9 Things to Know About NASA’s Nancy Grace Roman Space Telescope; Discover More Topics From NASA; National Aeronautics and Space Administration; Follow NASA
- Source date labels: Mar 04, 2025

### huygens
- URL: https://science.nasa.gov/mission/cassini/spacecraft/huygens-probe/
- Retrieved title: Huygens Probe - NASA Science
- Status: HTTP 200; content checked 2026-11-08.
- Headings observed: Cassini; Most Distant Landing; Science Highlights; Discover More Topics From NASA; National Aeronautics and Space Administration; Follow NASA
- Source date labels: Nov 03, 2024

### jwst
- URL: https://science.nasa.gov/mission/webb/science-overview/science-explainers/how-will-webb-study-exoplanets/
- Retrieved title: How Will Webb Study Exoplanets? - NASA Science
- Status: HTTP 200; content checked 2026-11-08.
- Headings observed: How Will Webb Study Exoplanets?; Contents; Webb will deliver both high-resolution data and images in a broader range of infrared light to improve our studies of exoplanets.; Wait, What Are Exoplanets?; Webb will deliver details about exoplanets that no other telescope can.; Webb will deliver details about exoplanets that no other telescope can.; How can Webb analyze exoplanets’ atmospheres?; How can Webb’s data be transformed into models or “maps” of exoplanets?; Will Webb take any images of exoplanets?; National Aeronautics and Space Administration; Follow NASA
- Source date labels: Jun 04, 2026

### maveninst
- URL: https://svs.gsfc.nasa.gov/11053/
- Retrieved title: NASA SVS | MAVEN Broadcast-Quality Spacecraft and Instrument Footage
- Status: HTTP 200; content checked 2026-11-08.
- Headings observed: MAVEN Broadcast-Quality Spacecraft and Instrument Footage; For More Information; Credits; Video editors; Producer; Scientist; Videographers; Missions; Series; Related; Investigating the Martian Atmosphere; MAVEN Particles & Fields Package; MAVEN Launch Highlights; MAVEN: Mars Atmospheric Loss; Release date; You may also like...
- Source date labels: This page was originally published on Monday, July 30, 2012.

### kepler452
- URL: https://www.nasa.gov/news-release/nasas-kepler-mission-discovers-bigger-older-cousin-to-earth/
- Retrieved title: NASA’s Kepler Mission Discovers Bigger, Older Cousin to Earth - NASA
- Status: HTTP 200; content checked 2026-11-08.
- Headings observed: News & Events; Multimedia; Suggested Searches; Featured; NASA’s Twin ESCAPADE Spacecraft to Slingshot Past Earth on Way to Mars; NASA Announces X-70 Experimental Aircraft to Advance Flight Research; What’s Up: November 2026 Skywatching Tips from NASA; Missions; Humans in Space; Earth; The Solar System; The Universe; Science; Aeronautics; Technology; Learning Resources; About NASA; NASA en Español; News & Events; Multimedia; Featured; NASA’s Twin ESCAPADE Spacecraft to Slingshot Past Earth on Way to Mars; Hubble Learns Galactic History From Stars; NASA’s Swift Observatory Re-Entered Atmosphere
- Source date labels: Jul 26, 2023

### mavenscience
- URL: https://science.nasa.gov/missions/maven/nasas-maven-makes-first-observation-of-atmospheric-sputtering-at-mars/
- Retrieved title: NASA’s MAVEN Makes First Observation of Atmospheric Sputtering at Mars - NASA Science
- Status: HTTP 200; content checked 2026-11-08.
- Headings observed: NASA’s MAVEN Makes First Observation of Atmospheric Sputtering at Mars; Share; Details; Related Terms; National Aeronautics and Space Administration; Follow NASA
- Source date labels: May 28, 2025

## Failed route log

web_extract reported a search-only backend and was not used again. requests retrieval supplied the actual page content. Guessed paths that returned 404 were not cited as checked; working replacements are in the ledger above.

- HTTP 404: https://science.nasa.gov/jupiter/moons/ganymede/facts/
- HTTP 404: https://science.nasa.gov/jupiter/moons/europa/facts/
- HTTP 404: https://science.nasa.gov/dwarf-planets/makemake/facts/
- HTTP 404: https://science.nasa.gov/mission/maven/science-instruments/
- HTTP 404: https://science.nasa.gov/mission/europa-clipper/science-instruments/
- HTTP 404: https://www.esa.int/Science_Exploration/Space_Science/Juice/Juice_s_instruments
- HTTP 404: https://science.nasa.gov/mission/cassini/science/
- HTTP 404: https://www.esa.int/Science_Exploration/Space_Science/Rosetta/Rosetta_instruments
- HTTP 404: https://science.nasa.gov/jupiter/jupiter-moons/europa/facts/ (replaced by the checked Europa overview and specific Clipper instrument page).

## Editorial evidence policy

Each lesson has three explanatory sections, a five-part observation → instrument → inference → alternative → uncertainty chain, and a teach-back. Alternatives are explicitly competing explanations or test designs, not asserted discoveries. Synthetic practice scenarios are labeled hypothetical when they introduce observations not reported by a mission. Written work has self-assessment rubrics, not machine-certified scientific grading. MCQ distractors are intentionally wrong; only the keyed answer and explanation are instructional claims.

### davinciscience
- URL: https://science.nasa.gov/mission/davinci/davinci-science/
- Retrieved title: DAVINCI Science
- Status: HTTP 200; content checked 2026-11-08.
- Headings observed: DAVINCI Science; Did processes similar to Earth's — plate tectonics and liquid water — shape the Venusian surface? The DAVINCI mission hopes to find out.; Science Instruments; Main spacecraft:; Probe:; Venus; Discover More Topics From NASA; Perseverance Rover; Parker Solar Probe; Juno; National Aeronautics and Space Administration; Follow NASA
- Date labels: Mar 03, 2026

### dragonflyinst
- URL: https://science.nasa.gov/mission/dragonfly/spacecraft-and-instruments/
- Retrieved title: Dragonfly Spacecraft and Instruments
- Status: HTTP 200; content checked 2026-11-08.
- Headings observed: Dragonfly Rotorcraft and Instruments; Flying on Saturn's Moon; Powering Dragonfly; The Spacecraft; Specifications; Science on Board; Entry, Descent, and Landing; NASA’s Dragonfly Rotorcraft Gets Decked Out, Tested; Discover More; Radioisotope Power Systems; Saturn and Titan Resources; National Aeronautics and Space Administration; Follow NASA
- Date labels: Oct 19, 2026
