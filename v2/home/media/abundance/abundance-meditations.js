/* The 1440 abundance meditations, short and long, in the masked voice.
   They land in Dropbox/2026 ANCESTRAL PEAKS/RECORDINGS/MASKED SESSIONS/abundance meditations — short and long/.
   For each one: copy it into media/abundance/ as a web mp3 (ffmpeg -map_metadata -1 -b:a 96k), run shared/tools/make_env.py on it,
   and add a line below. The shelf on the home page builds itself from this list and stays hidden while the list is empty. */
window.AP_ABUNDANCE = [
  { file: "abundance-the-pocket", title: "The Pocket", sub: "Three minutes · the stone breath, counted", dur: 179.1, scene: "creek" },
  { file: "abundance-journey-of-the-stone", title: "The Journey of the Stone", sub: "Short · shaped by water and time, and still here", dur: 155.7, scene: "wind" },
  { file: "abundance-the-dry-spring", title: "The Dry Spring", sub: "Short · you don't panic, you tell yourself a joke", dur: 169.2, scene: "wind" },
  { file: "abundance-the-abundance-meditation", title: "The Abundance Meditation", sub: "Fifteen minutes · for headphones", dur: 888.2, scene: "creek" },
  { file: "abundance-four-movements", title: "Four Movements", sub: "Seventeen minutes · for the drive or the gym", dur: 999.4, scene: "dawn" },
  { file: "abundance-the-full-crossing", title: "The Full Crossing", sub: "Twenty-seven minutes · seven movements", dur: 1654.7, scene: "wind" },
  { file: "abundance-the-whole-crossing", title: "The Whole Crossing", sub: "Forty-three minutes · for a long drive or a flight", dur: 2583.9, scene: "hearth" },
];
