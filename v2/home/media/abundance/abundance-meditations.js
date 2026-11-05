/* The 1440 abundance meditations, short and long, in the masked voice.
   They land in Dropbox/2026 ANCESTRAL PEAKS/RECORDINGS/MASKED SESSIONS/abundance meditations — short and long/.
   For each one: copy it into media/abundance/ as a web mp3 (ffmpeg -map_metadata -1 -b:a 96k), run shared/tools/make_env.py on it,
   and add a line below. The shelf on the home page builds itself from this list and stays hidden while the list is empty. */
window.AP_ABUNDANCE = [
  // { file: "abundance-short-the-stream", title: "The stream, short", sub: "Fifteen minutes · dawn bed", dur: 900, scene: "dawn" },
];
