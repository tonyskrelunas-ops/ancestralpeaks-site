/* THE LISTENING ROOM — a store window. Every recording the room holds, one entry each. (rebuilt 2026-11-07)
   Everyone sees every entry and can play its 30-second preview (media/previews/<id>-30s.mp3).
   free: true  = opens in full on this site after the free sign-up (first name and email). Only these two have a
                 full file in the repo (full: the path under media/). Every other recording plays in full only for
                 paying members, inside the Payhip membership; the page shows its preview and the members' door.
   shelf:  free | sessions (the teachings and crossings) | sittings (the short practices and the long sittings)
   mins:   the length shown on the page, as Tony labels it.   dur: the full recording, in seconds.
   at:     where the preview starts in the full recording (seconds), 1 s before the voice clearly begins.
   bed:    creek | dawn | desert | ocean | hearth        field: water | dawn | wind | stars | embers
   img:    a still in media/img/      video: a loop in media/video/ (or null)
   Source of every recording: Dropbox/2026 ANCESTRAL PEAKS/RECORDINGS/MASKED SESSIONS/. */
window.PEAKS_SESSIONS = {
  "sessions": [
    {
      "id": "week1-settle-yourself-first", "shelf": "free", "free": true, "n": "Week one", "where": "first light", "title": "Settle yourself first",
      "blurb": "The runner on Big Mountain, the stone in his hand, why the eyes narrow under stress, and the breath counted with you at the end.",
      "line": "Standing tall, widening your view, and softening your jaw tells your body it is safe to think again.",
      "mins": "6 min", "dur": 382, "at": 7.5, "bed": "dawn", "field": "dawn", "video": "v-dawn-meadow", "img": "canyon-de-chelly-1600",
      "full": "audio/week1-settle-yourself-first.mp3", "env": "env/week1-settle-yourself-first.env.js"
    },
    {
      "id": "the-pocket", "shelf": "free", "free": true, "n": "Three minutes", "where": "the creek", "title": "The Pocket",
      "blurb": "Relax the mind, the face and the jaw. The pebble on the tongue, then three rounds of four in, four hold, six out. The one to run on a Tuesday.",
      "line": "Okay, now breathe normal.",
      "mins": "3 min", "dur": 179, "at": 1.2, "bed": "creek", "field": "water", "video": "v-creek-rapids", "img": "oakcreek-rapids-1400",
      "full": "abundance/abundance-the-pocket.mp3", "env": "env/the-pocket.env.js"
    },

    {
      "id": "a-word-before-you-begin", "shelf": "sessions", "n": "A talk", "where": "before the sessions", "title": "A Word Before You Begin",
      "blurb": "What he told a room of college students: the first year that went wrong, the way back home, and the small morning habits that carry a life.",
      "line": "May I approach everything I do with purpose, with dignity, and with beauty.",
      "mins": "9 min", "dur": 523, "at": 0, "bed": "dawn", "field": "dawn", "video": null, "img": "meadow-trail-walker-1600"
    },
    {
      "id": "before-we-start", "shelf": "sessions", "n": "Begin here", "where": "the creek", "title": "Before We Start",
      "blurb": "The stream at first light, the pebble that calls you, one round of the breath into a body scan, and gratitude. The shortest way in.",
      "line": "Your job is not to worry. To stay in the moment, to stay calm at all times.",
      "mins": "6 min", "dur": 364, "at": 10.5, "bed": "creek", "field": "water", "video": "v-pebbles", "img": "oakcreek-pebbles-photo-1400"
    },
    {
      "id": "week2-know-what-you-steer-by", "shelf": "sessions", "n": "Week two", "where": "the Pacific", "title": "Know what you steer by",
      "blurb": "Ten million square miles of open water, the houses where the stars rise, the 1976 crossing to Tahiti, and the one direction that holds.",
      "line": "What is your house? The one direction that holds when everything else moves.",
      "mins": "5 min", "dur": 299, "at": 5.35, "bed": "ocean", "field": "stars", "video": "v-pacific-sunset", "img": "pacific-rocks-1600"
    },
    {
      "id": "week3-what-holds-in-a-storm", "shelf": "sessions", "n": "Week three", "where": "the sand", "title": "What holds in a storm",
      "blurb": "The salt caravan out of Timbuktu, the guide who reads the sand by day and the stars by night, and what he does when the wall of sand rolls in.",
      "line": "The sand and the stars fail at different times, so together they never fail at once.",
      "mins": "4 min", "dur": 219, "at": 4.85, "bed": "desert", "field": "wind", "video": null, "img": "dune-slope-1600"
    },
    {
      "id": "the-empty-quarter", "shelf": "sessions", "n": "The crossing", "where": "the sand", "title": "The Empty Quarter",
      "blurb": "On the fourth day the well was dry. A man alone in the largest sand desert on earth, and the trained thing he did instead of running.",
      "line": "At that moment the fear says run, and out there the fear is always wrong.",
      "mins": "6 min", "dur": 382, "at": 4.55, "bed": "desert", "field": "wind", "video": null, "img": "dune-bank-1600"
    },
    {
      "id": "the-far-messengers-of-time", "shelf": "sessions", "n": "The longest crossing", "where": "the fire", "title": "The Far Messengers of Time",
      "blurb": "Between a grandmother and her great-grandchildren lies a gap wider than any desert. The keepers of memory, the song that is the country, the book carriers, the names of the rice.",
      "line": "When one of the old keepers is gone, a whole library burns.",
      "mins": "6 min", "dur": 377, "at": 6.75, "bed": "hearth", "field": "embers", "video": null, "img": "fire-moon-1600"
    },
    {
      "id": "the-gratitude-meditation", "shelf": "sessions", "n": "Morning practice", "where": "first light", "title": "The Gratitude Meditation",
      "blurb": "The full gratitude sitting: the stream, walking feather-light, the medicines, the pebble on the tongue, four rounds of the stone breath, and the eagle watching over you.",
      "line": "Thank you for taking this journey. Thank you for still being here. You are beautiful, you are strong.",
      "mins": "8 min", "dur": 484, "at": 4.65, "bed": "dawn", "field": "dawn", "video": "v-garden-waterfall", "img": "creek-log-1400"
    },

    {
      "id": "the-journey-of-the-stone", "shelf": "sittings", "n": "Two minutes", "where": "the creek", "title": "The Journey of the Stone",
      "blurb": "The pebble's long road, from the lava and the river to the palm of your hand, and the thanks you give it.",
      "line": "This stone is older than you, and it will be older than your grandchildren.",
      "mins": "2 min", "dur": 156, "at": 4.0, "bed": "creek", "field": "water", "video": null, "img": "hand-stone-1400"
    },
    {
      "id": "the-dry-spring", "shelf": "sittings", "n": "Three minutes", "where": "the sand", "title": "The Dry Spring",
      "blurb": "A spring that ran dry, and what held underneath it. For the storm, and for the crossing.",
      "line": "You do not make the calm. You retrieve it.",
      "mins": "3 min", "dur": 169, "at": 4.1, "bed": "desert", "field": "wind", "video": null, "img": "dunes-footprints-1600"
    },
    {
      "id": "the-abundance-meditation", "shelf": "sittings", "n": "Fifteen minutes", "where": "headphones", "title": "The Abundance Meditation",
      "blurb": "Made for headphones. The stream, the pebble that calls you, the journey of the rock, the eagle, the stone breath counted, then a full minute on your own.",
      "line": "The museum of proof in you.",
      "mins": "15 min", "dur": 888, "at": 16.4, "bed": "creek", "field": "water", "video": "v-creek-rapids-2", "img": "oakcreek-fall-log-1400"
    },
    {
      "id": "four-movements", "shelf": "sittings", "n": "Seventeen minutes", "where": "for the drive", "title": "Four Movements",
      "blurb": "The Road, The Stone, The Crossing, The Return. Made for driving, working and training, so nothing in it asks you to close your eyes.",
      "line": "Far to the east, they are singing.",
      "mins": "17 min", "dur": 999, "at": 8.8, "bed": "desert", "field": "wind", "video": null, "img": "sand-road-1600"
    },
    {
      "id": "the-morning-journey", "shelf": "sittings", "n": "Nineteen minutes", "where": "facing the Peaks", "title": "The Morning Journey",
      "blurb": "A morning meditation at breakfast, facing the Peaks: a gratitude inventory, the pebble's long journey, the stone breath counted, then the crossing east to where they are still singing.",
      "line": "Feel the rhythm of the earth. Feel the heartbeat.",
      "mins": "19 min", "dur": 1118, "at": 5.85, "bed": "dawn", "field": "dawn", "video": null, "img": "peaks-morning-2000"
    },
    {
      "id": "the-full-crossing", "shelf": "sittings", "n": "Twenty-seven minutes", "where": "the long sitting", "title": "The Full Crossing",
      "blurb": "The crossing, the breath, the eagle, the ancient trail, the museum of proof, the young chief and the blessing. A proven long sitting, kept whole.",
      "line": "The calm did not make him comfortable. The calm made him remember.",
      "mins": "27 min", "dur": 1655, "at": 8.9, "bed": "desert", "field": "wind", "video": null, "img": "peaks-trail-2200"
    },
    {
      "id": "the-whole-crossing", "shelf": "sittings", "n": "Forty-three minutes", "where": "the whole arc", "title": "The Whole Crossing",
      "blurb": "The whole arc in one sitting: the gratitude inventory, the pebble meditation, the breath rounds by the creek, the east singing, the crossing, the eagle, the young chief, the blessing.",
      "line": "You store it in your bones in the quiet days.",
      "mins": "43 min", "dur": 2584, "at": 91.7, "bed": "dawn", "field": "dawn", "video": null, "img": "sedona-sunset-2200"
    }
  ],
  "notes": [
    { "id": "note-11-go-running-early", "title": "Go running early", "sub": "A grandmother's teaching", "dur": 56, "bed": "dawn", "img": "red-trail-walker-800" },
    { "id": "note-18-you-have-to-be-in-state", "title": "You have to be in state", "sub": "Settle yourself first", "dur": 79, "bed": "dawn", "img": "peaks-snow-800" },
    { "id": "note-21-he-knew-by-his-pelvic-bone", "title": "He knew by his pelvic bone", "sub": "Know what you steer by", "dur": 49, "bed": "ocean", "img": "pacific-waves-800" },
    { "id": "note-22-blindfolded-in-the-hull", "title": "Blindfolded in the hull", "sub": "Know what you steer by", "dur": 70, "bed": "ocean", "img": "pacific-torrey-800" },
    { "id": "note-23-under-sixty-beats", "title": "Under sixty beats", "sub": "The breath", "dur": 59, "bed": "creek", "img": "oakcreek-fall-800" },
    { "id": "note-24-the-birds-and-the-cloud", "title": "The birds and the cloud", "sub": "Know what you steer by", "dur": 72, "bed": "ocean", "img": "river-peaks-900" },
    { "id": "note-27-panic-in-the-desert", "title": "Panic in the desert", "sub": "What holds in a storm", "dur": 60, "bed": "desert", "img": "sedona-bellrock-800" },
    { "id": "note-34-the-runner-pick-up-a-pebble-run-east", "title": "Pick up a pebble, run east", "sub": "The runner", "dur": 56, "bed": "dawn", "img": "valley-sunset-900" },
    { "id": "note-35-the-races-were-spiritual", "title": "The races were spiritual", "sub": "The runner", "dur": 54, "bed": "dawn", "img": "peaks-meadow-evening-800" },
    { "id": "note-44-look-at-the-positivity", "title": "Look at the positivity", "sub": "What holds in a storm", "dur": 67, "bed": "hearth", "img": "antelope-light-800" }
  ]
};
