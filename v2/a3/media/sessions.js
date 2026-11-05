/* THE LISTENING ROOM — every recording the room holds. One entry each.
   shelf: "sessions" (the weeks' teachings, 4 to 6 min) | "short" (3 to 13 min) | "long" (15 to 43 min)
   bed:   creek | dawn | desert | ocean | hearth        field: water | dawn | wind | stars | embers
   video: a loop in media/video/ (or null)             img: a still in media/img/        dur: seconds
   pending: true  = the masked file has not landed yet. The page probes media/audio/<src> and shows the entry only when
                    the file is really there, so nothing is promised that does not exist.
   from:  where the masked file lands in Dropbox/2026 ANCESTRAL PEAKS/RECORDINGS/MASKED SESSIONS/ (a glob).
          tools/sync-sessions.py copies it into media/audio/<src>, writes the envelope, fills dur and clears pending.
   ONLY files from MASKED SESSIONS ever go in here. Never a raw recording. */
window.PEAKS_SESSIONS = {
  "sessions": [
    {
      "id": "week1-settle-yourself-first", "shelf": "sessions", "n": "Week one", "where": "first light", "title": "Settle yourself first",
      "blurb": "The runner on Big Mountain, the stone in his hand, why the eyes narrow under stress, and the breath counted with you at the end.",
      "line": "Standing tall, widening your view, and softening your jaw tells your body it is safe to think again.",
      "src": "week1-settle-yourself-first.mp3", "dur": 382, "bed": "dawn", "field": "dawn",
      "video": "v-dawn-meadow", "img": "canyon-de-chelly-1600", "snip": "snip-week1-settle-yourself-first.mp3",
      "from": "WEEK 1 — Settle yourself first — masked voice*.mp3"
    },
    {
      "id": "week2-know-what-you-steer-by", "shelf": "sessions", "n": "Week two", "where": "the Pacific", "title": "Know what you steer by",
      "blurb": "Ten million square miles of open water, the houses where the stars rise, the 1976 crossing to Tahiti, and the one direction that holds.",
      "line": "What is your house? The one direction that holds when everything else moves.",
      "src": "week2-know-what-you-steer-by.mp3", "dur": 299, "bed": "ocean", "field": "stars",
      "video": "v-pacific-sunset", "img": "pacific-rocks-1600", "snip": "snip-week2-know-what-you-steer-by.mp3",
      "from": "WEEK 2 — Know what you steer by — masked voice*.mp3"
    },
    {
      "id": "week3-what-holds-in-a-storm", "shelf": "sessions", "n": "Week three", "where": "the sand", "title": "What holds in a storm",
      "blurb": "The salt caravan out of Timbuktu, the guide who reads the sand by day and the stars by night, and what he does when the wall of sand rolls in.",
      "line": "The sand and the stars fail at different times, so together they never fail at once.",
      "src": "week3-what-holds-in-a-storm.mp3", "dur": 219, "bed": "desert", "field": "wind",
      "video": null, "img": "dune-slope-1600", "snip": "snip-week3-what-holds-in-a-storm.mp3",
      "from": "WEEK 3 — What holds in a storm — masked voice*.mp3"
    },
    {
      "id": "the-empty-quarter", "shelf": "sessions", "n": "The crossing", "where": "the sand", "title": "The Empty Quarter",
      "blurb": "On the fourth day the well was dry. A man alone in the largest sand desert on earth, and the trained thing he did instead of running.",
      "line": "At that moment the fear says run, and out there the fear is always wrong.",
      "src": "the-empty-quarter.mp3", "dur": 382, "bed": "desert", "field": "wind",
      "video": null, "img": "dune-bank-1600", "snip": "snip-the-empty-quarter.mp3",
      "from": "THE EMPTY QUARTER — the crossing — masked voice*.mp3"
    },
    {
      "id": "the-far-messengers-of-time", "shelf": "sessions", "n": "The longest crossing", "where": "the fire", "title": "The far messengers of time",
      "blurb": "Between a grandmother and her great-grandchildren lies a gap wider than any desert. The keepers of memory, the song that is the country, the book carriers, the names of the rice.",
      "line": "When one of the old keepers is gone, a whole library burns.",
      "src": "the-far-messengers-of-time.mp3", "dur": 377, "bed": "hearth", "field": "embers",
      "video": null, "img": "fire-moon-1600", "snip": "snip-the-far-messengers-of-time.mp3",
      "from": "THE FAR MESSENGERS OF TIME — masked voice*.mp3"
    },

    {
      "id": "before-we-start", "shelf": "short", "n": "Begin here", "where": "the creek", "title": "Before we start",
      "blurb": "The stream at first light, the pebble that calls you, one round of the breath into a body scan, and gratitude. The shortest way in.",
      "line": "Your job is not to worry. To stay in the moment, to stay calm at all times.",
      "src": "before-we-start.mp3", "dur": 364, "bed": "creek", "field": "water",
      "video": "v-pebbles", "img": "oakcreek-pebbles-photo-1400", "snip": "snip-before-we-start.mp3",
      "from": "BEFORE WE START — masked voice*.mp3"
    },
    {
      "id": "the-gratitude-meditation", "shelf": "short", "n": "Morning practice", "where": "first light", "title": "The Gratitude Meditation",
      "blurb": "The full gratitude sitting: the stream, walking feather-light, the medicines, the pebble on the tongue, four rounds of the stone breath, and the eagle watching over you.",
      "line": "Thank you for taking this journey. Thank you for still being here. You are beautiful, you are strong.",
      "src": "the-gratitude-meditation.mp3", "dur": 484, "bed": "dawn", "field": "dawn",
      "video": "v-garden-waterfall", "img": "creek-log-1400", "snip": "snip-the-gratitude-meditation.mp3",
      "from": "THE GRATITUDE MEDITATION*masked voice*.mp3"
    },
    {
      "id": "the-pebble-meditation", "shelf": "short", "n": "The breath", "where": "the creek", "title": "The Pebble Meditation",
      "blurb": "Eyes closed at a stream. A hand on the ground, a pebble that calls you, three rounds of the breath, the eagle over the canyons, the petroglyphs and the arrival, and the journey home.",
      "line": "Thank you, Mother Earth. Father Sky.",
      "src": "the-pebble-meditation.mp3", "dur": 800, "bed": "creek", "field": "water",
      "video": "v-waterfall", "img": "hand-stone-1400", "snip": null, "pending": true,
      "from": "THE PEBBLE MEDITATION*masked voice*.mp3"
    },
    {
      "id": "the-pocket", "shelf": "short", "n": "Three minutes", "where": "the creek", "title": "The Pocket",
      "blurb": "Relax the mind, the face and the jaw. The pebble on the tongue, then three rounds of four in, four hold, six out. The one to run on a Tuesday.",
      "line": "Okay, now breathe normal.",
      "src": "the-pocket.mp3", "dur": 180, "bed": "creek", "field": "water",
      "video": "v-creek-rapids", "img": "oakcreek-rapids-1400", "snip": null, "pending": true,
      "from": "abundance meditations — short and long/THE POCKET*.mp3"
    },
    {
      "id": "the-journey-of-the-stone", "shelf": "short", "n": "Two minutes", "where": "the creek", "title": "The Journey of the Stone",
      "blurb": "The pebble's long road, from the lava and the river to the palm of your hand, and the thanks you give it.",
      "line": "This stone is older than you, and it will be older than your grandchildren.",
      "src": "the-journey-of-the-stone.mp3", "dur": 120, "bed": "creek", "field": "water",
      "video": null, "img": "oakcreek-pebbles-photo-1400", "snip": null, "pending": true,
      "from": "abundance meditations — short and long/THE JOURNEY OF THE STONE*.mp3"
    },
    {
      "id": "the-dry-spring", "shelf": "short", "n": "Three minutes", "where": "the sand", "title": "The Dry Spring",
      "blurb": "A spring that ran dry, and what held underneath it. For the storm, and for the crossing.",
      "line": "You do not make the calm. You retrieve it.",
      "src": "the-dry-spring.mp3", "dur": 180, "bed": "desert", "field": "wind",
      "video": null, "img": "dunes-footprints-1600", "snip": null, "pending": true,
      "from": "abundance meditations — short and long/THE DRY SPRING*.mp3"
    },

    {
      "id": "the-morning-journey", "shelf": "long", "n": "Morning practice", "where": "first light", "title": "The Morning Journey",
      "blurb": "A morning meditation at breakfast, facing the Peaks: a gratitude inventory, the pebble's long journey, the stone breath counted, then the crossing east to where they are still singing.",
      "line": "Feel the rhythm of the earth. Feel the heartbeat.",
      "src": "the-morning-journey.mp3", "dur": 1118, "bed": "dawn", "field": "dawn",
      "video": null, "img": "peaks-morning-2000", "snip": "snip-the-morning-journey.mp3",
      "from": "THE MORNING JOURNEY — masked voice*.mp3"
    },
    {
      "id": "the-abundance-meditation", "shelf": "long", "n": "Fifteen minutes · headphones", "where": "the creek", "title": "The Abundance Meditation",
      "blurb": "Made for headphones. The stream, the pebble that calls you, the journey of the rock, the eagle, the stone breath counted, then a full minute on your own, and gratitude for those who kept things for you.",
      "line": "The museum of proof in you.",
      "src": "the-abundance-meditation.mp3", "dur": 900, "bed": "creek", "field": "water",
      "video": "v-creek-rapids-2", "img": "oakcreek-fall-log-1400", "snip": null, "pending": true,
      "from": "abundance meditations — short and long/THE ABUNDANCE MEDITATION*.mp3"
    },
    {
      "id": "four-movements", "shelf": "long", "n": "Seventeen minutes · for the drive", "where": "the sand", "title": "Four Movements",
      "blurb": "The Road, The Stone, The Crossing, The Return. Made for driving, working and training, so nothing in it asks you to close your eyes.",
      "line": "Far to the east, they are singing.",
      "src": "four-movements.mp3", "dur": 1020, "bed": "desert", "field": "wind",
      "video": null, "img": "sand-road-1600", "snip": null, "pending": true,
      "from": "abundance meditations — short and long/FOUR MOVEMENTS*.mp3"
    },
    {
      "id": "the-full-crossing", "shelf": "long", "n": "Twenty-seven minutes", "where": "the sand", "title": "The Full Crossing",
      "blurb": "The crossing, the breath, the eagle, the ancient trail, the museum of proof, the young chief and the blessing. A proven long sitting, kept whole.",
      "line": "The calm did not make him comfortable. The calm made him remember.",
      "src": "the-full-crossing.mp3", "dur": 1620, "bed": "desert", "field": "wind",
      "video": null, "img": "peaks-trail-2200", "snip": null, "pending": true,
      "from": "abundance meditations — short and long/THE FULL CROSSING*.mp3"
    },
    {
      "id": "the-whole-crossing", "shelf": "long", "n": "Forty-three minutes", "where": "first light", "title": "The Whole Crossing",
      "blurb": "The whole arc in one sitting: the gratitude inventory, the pebble meditation, the breath rounds by the creek, the east singing, the crossing, the eagle, the young chief, the blessing.",
      "line": "You store it in your bones in the quiet days.",
      "src": "the-whole-crossing.mp3", "dur": 2580, "bed": "dawn", "field": "dawn",
      "video": null, "img": "sedona-sunset-2200", "snip": null, "pending": true,
      "from": "abundance meditations — short and long/THE WHOLE CROSSING*.mp3"
    }
  ],
  "notes": [
    { "id": "note-11", "title": "Go running early", "sub": "A grandmother's teaching", "src": "note-11-go-running-early.mp3", "dur": 56, "bed": "dawn" },
    { "id": "note-18", "title": "You have to be in state", "sub": "Settle yourself first", "src": "note-18-you-have-to-be-in-state.mp3", "dur": 79, "bed": "dawn" },
    { "id": "note-21", "title": "He knew by his pelvic bone", "sub": "Know what you steer by", "src": "note-21-he-knew-by-his-pelvic-bone.mp3", "dur": 49, "bed": "ocean" },
    { "id": "note-22", "title": "Blindfolded in the hull", "sub": "Know what you steer by", "src": "note-22-blindfolded-in-the-hull.mp3", "dur": 70, "bed": "ocean" },
    { "id": "note-23", "title": "Under sixty beats", "sub": "The breath", "src": "note-23-under-sixty-beats.mp3", "dur": 59, "bed": "creek" },
    { "id": "note-24", "title": "The birds and the cloud", "sub": "Know what you steer by", "src": "note-24-the-birds-and-the-cloud.mp3", "dur": 72, "bed": "ocean" },
    { "id": "note-27", "title": "Panic in the desert", "sub": "What holds in a storm", "src": "note-27-panic-in-the-desert.mp3", "dur": 61, "bed": "desert" },
    { "id": "note-34", "title": "Pick up a pebble, run east", "sub": "The runner", "src": "note-34-the-runner-pick-up-a-pebble-run-east.mp3", "dur": 56, "bed": "dawn" },
    { "id": "note-35", "title": "The races were spiritual", "sub": "The runner", "src": "note-35-the-races-were-spiritual.mp3", "dur": 54, "bed": "dawn" },
    { "id": "note-44", "title": "Look at the positivity", "sub": "What holds in a storm", "src": "note-44-look-at-the-positivity.mp3", "dur": 67, "bed": "hearth" }
  ]
};
