/* Santa's Little Helper: content */
(function (root) {
  'use strict';

  const AGE_GROUPS = [
    { id: 'baby', label: 'Baby & toddler (0-2)' },
    { id: 'little', label: 'Little kid (3-5)' },
    { id: 'kid', label: 'Kid (6-9)' },
    { id: 'tween', label: 'Tween (10-12)' },
    { id: 'teen', label: 'Teen (13-17)' },
    { id: 'adult', label: 'Grown-up' }
  ];
  const INTERESTS = [
    { id: 'creative', label: 'Arts & crafts' }, { id: 'outdoors', label: 'Outdoors' },
    { id: 'tech', label: 'Tech & gadgets' }, { id: 'games', label: 'Games & puzzles' },
    { id: 'books', label: 'Books & reading' }, { id: 'cooking', label: 'Cooking & treats' },
    { id: 'sports', label: 'Sports & active' }, { id: 'music', label: 'Music' },
    { id: 'cozy', label: 'Cozy & self-care' }, { id: 'science', label: 'Science & building' },
    { id: 'pets', label: 'Pet lovers' }, { id: 'experiences', label: 'Experiences' }
  ];

  const A = ['baby', 'little', 'kid', 'tween', 'teen', 'adult'];
  const GIFTS = [
    ['🧸', 'Soft plush animal', 20, ['baby', 'little'], ['cozy']],
    ['🔔', 'Stacking & sorting toy set', 18, ['baby'], ['science']],
    ['📚', 'Touch-and-feel board books', 15, ['baby'], ['books']],
    ['🎵', 'Toddler music instrument set', 25, ['baby', 'little'], ['music']],
    ['🛁', 'Bath toys that squirt and float', 12, ['baby', 'little'], ['cozy']],
    ['🚂', 'Wooden train set', 45, ['little', 'kid'], ['science', 'games']],
    ['🎨', 'Washable paint & easel', 35, ['little', 'kid'], ['creative']],
    ['🦕', 'Dinosaur figure collection', 20, ['little', 'kid'], ['science']],
    ['🧩', 'Floor puzzle (24-48 pieces)', 15, ['little'], ['games']],
    ['🏠', 'Play kitchen accessories', 30, ['little'], ['cooking']],
    ['🚲', 'Balance bike', 80, ['little'], ['outdoors', 'sports']],
    ['🔦', 'Kid explorer kit (flashlight, compass, binoculars)', 25, ['little', 'kid'], ['outdoors', 'science']],
    ['🧱', 'Building brick set', 40, ['kid', 'tween'], ['science', 'creative']],
    ['🔬', 'Kids microscope', 50, ['kid', 'tween'], ['science']],
    ['🌋', 'Volcano & slime science kit', 25, ['kid'], ['science']],
    ['📖', 'Chapter book box set', 30, ['kid', 'tween'], ['books']],
    ['🎲', 'Family board game', 30, ['kid', 'tween', 'teen', 'adult'], ['games']],
    ['🪁', 'Kite', 20, ['kid', 'tween'], ['outdoors']],
    ['⚽', 'Sports ball & mini goal', 35, ['kid', 'tween'], ['sports', 'outdoors']],
    ['🧵', 'Friendship bracelet kit', 15, ['kid', 'tween'], ['creative']],
    ['🍪', 'Kids baking set with cookie cutters', 25, ['kid', 'tween'], ['cooking']],
    ['🐾', 'Stuffed animal vet kit', 25, ['little', 'kid'], ['pets']],
    ['🤖', 'Beginner coding robot', 60, ['kid', 'tween'], ['tech', 'science']],
    ['🛼', 'Roller skates + pads', 60, ['kid', 'tween', 'teen'], ['sports']],
    ['🎤', 'Karaoke microphone', 30, ['kid', 'tween', 'teen'], ['music', 'tech']],
    ['✏️', 'Sketchbook & artist pencil set', 25, ['tween', 'teen', 'adult'], ['creative']],
    ['🧪', 'Crystal growing kit', 20, ['kid', 'tween'], ['science']],
    ['🌌', 'Galaxy star projector', 30, ['kid', 'tween', 'teen'], ['cozy', 'tech']],
    ['🎧', 'Wireless headphones', 60, ['tween', 'teen', 'adult'], ['music', 'tech']],
    ['📷', 'Instant camera', 70, ['tween', 'teen', 'adult'], ['creative', 'tech']],
    ['🧶', 'Learn-to-crochet kit', 25, ['tween', 'teen', 'adult'], ['creative', 'cozy']],
    ['🧩', '1000-piece jigsaw puzzle', 20, ['teen', 'adult'], ['games', 'cozy']],
    ['🏀', 'Mini basketball hoop for a door', 25, ['tween', 'teen', 'adult'], ['sports', 'games']],
    ['🎮', 'Video game gift card', 25, ['tween', 'teen', 'adult'], ['games', 'tech']],
    ['💡', 'Color-changing LED strip lights', 25, ['tween', 'teen'], ['tech', 'cozy']],
    ['📓', 'Personalized journal', 20, ['tween', 'teen', 'adult'], ['creative', 'books']],
    ['🧦', 'Cozy fuzzy socks bundle', 15, ['tween', 'teen', 'adult'], ['cozy']],
    ['🔋', 'Portable phone charger', 30, ['teen', 'adult'], ['tech']],
    ['🎸', 'Ukulele starter pack', 50, ['tween', 'teen', 'adult'], ['music']],
    ['🍫', 'Hot cocoa gift basket', 30, ['teen', 'adult'], ['cooking', 'cozy']],
    ['🌶️', 'Hot sauce sampler', 30, ['adult'], ['cooking']],
    ['☕', 'Coffee or tea of the month (3 months)', 60, ['adult'], ['cooking', 'experiences']],
    ['🕯️', 'Scented candle set', 25, ['adult'], ['cozy']],
    ['🧣', 'Soft knit scarf & beanie', 30, ['teen', 'adult'], ['cozy', 'outdoors']],
    ['🪴', 'Easy-care houseplant & pot', 30, ['adult'], ['cozy']],
    ['🔪', 'Quality chef knife', 70, ['adult'], ['cooking']],
    ['🍳', 'Cast iron skillet', 40, ['adult'], ['cooking']],
    ['📚', 'E-reader', 110, ['teen', 'adult'], ['books', 'tech']],
    ['🥾', 'Hiking day pack', 50, ['teen', 'adult'], ['outdoors']],
    ['🔊', 'Bluetooth speaker', 50, ['teen', 'adult'], ['music', 'tech']],
    ['🧘', 'Yoga mat & blocks', 40, ['teen', 'adult'], ['sports', 'cozy']],
    ['💆', 'Heated neck wrap', 35, ['adult'], ['cozy']],
    ['🐶', 'Personalized pet ornament', 18, A, ['pets']],
    ['🦴', 'Puzzle feeder toy for their pet', 20, ['tween', 'teen', 'adult'], ['pets']],
    ['🎟️', 'Movie night voucher (tickets + snacks)', 40, ['kid', 'tween', 'teen', 'adult'], ['experiences']],
    ['⛸️', 'Ice skating or trampoline park day', 35, ['kid', 'tween', 'teen'], ['experiences', 'sports']],
    ['🦁', 'Zoo or aquarium family pass', 80, ['little', 'kid', 'adult'], ['experiences', 'pets']],
    ['🍝', 'Cooking class for two', 120, ['adult'], ['experiences', 'cooking']],
    ['🎭', 'Concert or show tickets', 100, ['teen', 'adult'], ['experiences', 'music']],
    ['🖼️', 'Framed family photo print', 35, ['adult'], ['creative']],
    ['🧳', 'Packing cube travel set', 25, ['teen', 'adult'], ['experiences']],
    ['💌', 'Coupon book of "one free hug / chore / breakfast in bed"', 0, A, ['experiences', 'cozy']],
    ['🍪', 'Homemade cookie tin', 10, A, ['cooking']],
    ['📝', 'Handwritten letter of favorite memories', 0, ['teen', 'adult'], ['books', 'cozy']]
  ].map(([emoji, name, price, ages, tags], i) => ({ id: 'g' + i, emoji, name, price, ages, tags }));

  // White Elephant safe picks (generic, funny or useful)
  const ELEPHANT_IDEAS = [
    'A giant tub of cheese puffs', 'A "World\'s Okayest" mug', 'Fancy hot sauce trio', 'A gnome for the garden',
    'Light-up holiday socks', 'Mini waffle maker', 'A rubber chicken (with dignity)', 'A cozy throw blanket',
    'Scratch-off lottery tickets', 'A puzzle of a really boring photo', 'Snack sampler box', 'A bacon-scented candle',
    'Phone tripod with remote', 'Card game for game night', 'A tiny desk vacuum', 'A bag of coal (and a gift card inside)'
  ];

  const ADVENT = [
    ['📮', 'Write your letter to Santa', 'Use the Letters tab and send it to the North Pole!'],
    ['🎄', 'Decorate the tree (or a tiny paper one)', 'Fun fact: the first decorated trees used apples and nuts.'],
    ['🍪', 'Bake or decorate cookies', 'Save one for Santa practice.'],
    ['🎶', 'Have a carol sing-along', 'Bonus points for a kazoo solo.'],
    ['❄️', 'Make paper snowflakes', 'No two snowflakes are exactly alike!'],
    ['🎬', 'Holiday movie night with popcorn', 'Pajamas required.'],
    ['💝', 'Do a secret kindness for a neighbor', 'Elves love secret missions.'],
    ['🦌', 'Make reindeer food for the lawn', 'Oats + a sprinkle of sugar (skip glitter, it hurts birds).'],
    ['📚', 'Read a Christmas story by flashlight', 'Under a blanket fort if possible.'],
    ['🖍️', 'Draw a card for someone far away', 'Mail it tomorrow.'],
    ['☃️', 'Build a snowman (or a sock snowman)', 'No snow? Use socks, rice and buttons.'],
    ['✨', 'Drive or walk to see the lights', 'Vote on the best house!'],
    ['🎁', 'Pick a toy to donate', 'Make room for giving.'],
    ['🍫', 'Hot cocoa taste test', 'Marshmallows vs. whipped cream. Decide!'],
    ['🧦', 'Make or decorate a stocking', 'Glitter glue is your friend.'],
    ['📞', 'Video call a grandparent', 'Sing them a song.'],
    ['🎨', 'Make homemade wrapping paper', 'Potato stamps work great.'],
    ['⭐', 'Stargaze and look for the North Star', 'It points the way to Santa\'s workshop.'],
    ['🕺', 'Christmas dance party', 'Freeze dance rules apply.'],
    ['🏠', 'Build a gingerbread house', 'Or a graham cracker cabin.'],
    ['💌', 'Write thank-you notes to helpers', 'Teachers, mail carriers, bus drivers.'],
    ['🔔', 'Learn how to say Merry Christmas in 3 languages', 'Feliz Navidad! Joyeux Noël! Frohe Weihnachten!'],
    ['🥕', 'Prepare a snack for the reindeer', 'Carrots are a reindeer favorite.'],
    ['🎅', 'Christmas Eve! Track Santa\'s sleigh', 'Head to the Santa tab and watch him fly!']
  ].map(([emoji, title, tip], i) => ({ day: i + 1, emoji, title, tip }));

  const ELF_TITLES = {
    cookie: '🍪 Cookie jar caper', tp: '🧻 TP the tree', marsh: '☁️ Marshmallow bath', zip: '🪢 Zipline', snow: '❄️ Flour snow angel',
    fish: '🐟 Gone fishing', selfie: '📸 Selfie time', note: '💌 Note from the North Pole', bandage: '🩹 Mummy wrap', cereal: '🥣 Cereal swim',
    race: '🏁 Car race', art: '🖍️ Elf artist', tea: '🫖 Tea party', fort: '🏕️ Blanket fort', stuck: '😬 Stuck on the wall',
    bake: '🧁 Elf bakery', ornaments: '🎄 Upside-down decorator', book: '📖 Story time', candy: '🍬 Candy cane fishing', bubble: '🛁 Pom-pom bubble bath',
    shoe: '👟 Shoe nap', countdown: '🔗 Paper chain', lego: '🧱 Brick builder', zoo: '🧸 Stuffy parade', grocery: '🍌 Fruit faces',
    donut: '🍩 Elf workout', map: '🗺️ Treasure map', snowman: '⛄ Snack snowman', kindness: '💝 Kindness mission', goodbye: '👋 Goodbye note'
  };

  /* Elf Scout missions: kid-safe prompt (doubles as a quiet idea for grown-ups) + grown-up setup notes. */
  const ELF_MISSIONS = [
    ['cookie', 'Have you checked if the elf has one hand in the cookie jar?', 'Perch the elf on the edge of the cookie jar with one arm inside, a few crumbs on the counter.', ['Cookie jar', 'Cookies or crumbs'], 'quick'],
    ['tp', 'Has anyone noticed the tree looking extra fluffy?', 'Drape toilet paper streamers over the tree with the elf holding the roll at the top.', ['1 roll of toilet paper'], 'quick'],
    ['marsh', 'Is it just me, or did the bath fill up with something squishy?', 'Fill the dry bathtub with mini marshmallows and pose the elf "swimming" in them.', ['Bag of mini marshmallows'], 'medium'],
    ['zip', 'Look up! Is something zooming across the room?', 'Tie string between two high points and hang the elf from it with a clothespin, like a zipline.', ['String or yarn', 'Clothespin'], 'medium'],
    ['snow', 'Did it snow inside last night?', 'Make a flour "snow angel" on the counter or a baking sheet with the elf lying in the middle.', ['Flour', 'Baking sheet'], 'medium'],
    ['fish', 'Has anyone checked the sink for fish?', 'Elf holding a toothbrush or string "fishing pole" over a sink with goldfish crackers.', ['Goldfish crackers', 'String', 'Pencil'], 'quick'],
    ['selfie', 'Did someone borrow the camera?', 'Set the elf next to a phone or toy camera with silly selfies of family toys on the screen or printed.', ['Old phone or toy camera'], 'quick'],
    ['note', 'Is there a tiny letter somewhere it does not belong?', 'Elf sitting next to a tiny handwritten note from the North Pole praising something kind your child did.', ['Paper', 'Pen'], 'quick'],
    ['bandage', 'Who is wrapped up like a mummy?', 'Wrap the elf (or a stuffed animal) in toilet paper or bandages with the elf "nurse" standing by.', ['Toilet paper or bandages'], 'quick'],
    ['cereal', 'Has the breakfast table been visited already?', 'Elf sitting in a bowl of cereal with the box tipped over and a spoon in hand.', ['Cereal', 'Bowl', 'Spoon'], 'quick'],
    ['race', 'Did the toy cars line up for something exciting?', 'Line up toy cars with the elf waving a paper checkered flag at the finish line.', ['Toy cars', 'Paper flag'], 'quick'],
    ['art', 'Has anyone seen a new drawing on the fridge?', 'Elf next to a crayon drawing of the family (or a dry erase doodle on the bathroom mirror).', ['Crayons or dry erase marker'], 'quick'],
    ['tea', 'Was there a party with the stuffed animals?', 'Set up a tea party with stuffed animals and the elf as host, cups and a tiny cookie each.', ['Tea set or cups', 'Snacks'], 'medium'],
    ['fort', 'Is there a new hideout in the living room?', 'Build a mini blanket fort from napkins or a dish towel with the elf peeking out with a flashlight.', ['Dish towel or napkins', 'Mini flashlight'], 'quick'],
    ['stuck', 'Has anyone checked if someone got stuck?', 'Tape the elf to the wall or fridge with painter\'s tape, plus a sign: "Oops! A little help?"', ['Painter\'s tape', 'Paper sign'], 'quick'],
    ['bake', 'Smells like somebody was baking, right?', 'Elf with a tiny pan of brownies or cookies and a sprinkle of flour on the counter.', ['Baked treat', 'Flour'], 'medium'],
    ['ornaments', 'Are the ornaments in the right spots?', 'Hang the elf upside down from the tree, holding an ornament as if decorating.', ['Ornament'], 'quick'],
    ['book', 'What story was being read last night?', 'Elf tucked in with a favorite storybook, a tiny pillow and a stuffed animal audience.', ['Picture book'], 'quick'],
    ['candy', 'Did the candy canes go somewhere?', 'Elf "fishing" for candy canes on the stairs or hanging them all over a lamp.', ['Candy canes'], 'quick'],
    ['bubble', 'Is someone hiding in the bubbles?', 'Elf in the sink full of pom-poms or cotton balls as "bubble bath".', ['Cotton balls or pom-poms'], 'quick'],
    ['shoe', 'Have you looked inside a shoe today?', 'Elf sleeping inside a sneaker with a sock blanket.', ['Sneaker', 'Sock'], 'quick'],
    ['countdown', 'Did someone start counting the days?', 'Elf next to a paper chain countdown where today\'s link has been removed.', ['Paper strips', 'Tape or glue'], 'medium'],
    ['lego', 'Did the building bricks build something new?', 'Elf standing on a small brick tower or sleigh with a flag.', ['Building bricks'], 'quick'],
    ['zoo', 'Are the stuffed animals all in a line?', 'Elf leading a parade of stuffed animals across the floor.', ['Stuffed animals'], 'quick'],
    ['grocery', 'Is something hiding with the fruit?', 'Elf drawing faces on bananas or oranges (use dry erase or skip drawing).', ['Bananas or oranges', 'Marker'], 'quick'],
    ['donut', 'Is somebody training to be a super-fit elf?', 'Elf with a donut or cookie "exercise class" using pretzel stick weights.', ['Pretzel sticks', 'Donut or cookie'], 'quick'],
    ['map', 'Is there a treasure map somewhere?', 'Elf holding a hand-drawn map that leads to a small surprise (a sticker, a candy cane, a coloring page).', ['Paper', 'Small surprise'], 'big'],
    ['snowman', 'Did the elf make a new friend?', 'Elf next to a tiny snowman made of marshmallows, pretzels and a chocolate chip face.', ['Marshmallows', 'Pretzel sticks', 'Chocolate chips'], 'medium'],
    ['kindness', 'Have you checked for a secret kindness mission?', 'Elf holding a note with a kindness mission: "Give someone a compliment today!"', ['Paper', 'Pen'], 'quick'],
    ['goodbye', 'Is there a goodbye note waiting?', 'Christmas Eve: elf with a farewell letter and a small gift or new pajamas.', ['Letter', 'Small gift or pajamas'], 'big']
  ].map(([id, kid, setup, props, effort]) => ({ id, kid, setup, props, effort, title: ELF_TITLES[id] || id }));

  // Santa's route: one stop per time zone, visited at local midnight (December offsets).
  const SANTA_STOPS = [
    ['Kiritimati, Kiribati', 14, 1.87, -157.4], ['Nukuʻalofa, Tonga', 13, -21.1, -175.2], ['Auckland, New Zealand', 13, -36.85, 174.76],
    ['Suva, Fiji', 12, -18.14, 178.44], ['Sydney, Australia', 11, -33.87, 151.21], ['Brisbane, Australia', 10, -27.47, 153.03],
    ['Tokyo, Japan', 9, 35.68, 139.69], ['Seoul, South Korea', 9, 37.57, 126.98], ['Manila, Philippines', 8, 14.6, 120.98],
    ['Beijing, China', 8, 39.9, 116.4], ['Bangkok, Thailand', 7, 13.76, 100.5], ['Dhaka, Bangladesh', 6, 23.81, 90.41],
    ['New Delhi, India', 5.5, 28.61, 77.21], ['Dubai, UAE', 4, 25.2, 55.27], ['Nairobi, Kenya', 3, -1.29, 36.82],
    ['Moscow, Russia', 3, 55.76, 37.62], ['Cairo, Egypt', 2, 30.04, 31.24], ['Cape Town, South Africa', 2, -33.92, 18.42],
    ['Rome, Italy', 1, 41.9, 12.5], ['Paris, France', 1, 48.86, 2.35], ['Lagos, Nigeria', 1, 6.52, 3.38],
    ['London, United Kingdom', 0, 51.51, -0.13], ['Reykjavík, Iceland', 0, 64.15, -21.94], ['Praia, Cape Verde', -1, 14.93, -23.51],
    ['South Georgia', -2, -54.28, -36.51], ['Rio de Janeiro, Brazil', -3, -22.91, -43.17], ['Buenos Aires, Argentina', -3, -34.6, -58.38],
    ['St. John\'s, Canada', -3.5, 47.56, -52.71], ['Halifax, Canada', -4, 44.65, -63.57], ['New York City, USA', -5, 40.71, -74.0],
    ['Toronto, Canada', -5, 43.65, -79.38], ['Chicago, USA', -6, 41.88, -87.63], ['Mexico City, Mexico', -6, 19.43, -99.13],
    ['Denver, USA', -7, 39.74, -104.99], ['Los Angeles, USA', -8, 34.05, -118.24], ['Vancouver, Canada', -8, 49.28, -123.12],
    ['Anchorage, USA', -9, 61.22, -149.9], ['Honolulu, USA', -10, 21.31, -157.86], ['Pago Pago, American Samoa', -11, -14.28, -170.7]
  ].map(([name, offset, lat, lon]) => ({ name, offset, lat, lon }));

  const SANTA_FACTS = [
    'Rudolph\'s nose glows brightest over the ocean so the sleigh never gets lost.',
    'Mrs. Claus packs cocoa in a thermos for the long trip over the Pacific.',
    'The elves load the sleigh in a special order so the right presents are on top in each town.',
    'Reindeer snack on carrots left out by children all around the world.',
    'Santa visits every home only when everyone inside is fast asleep.',
    'The sleigh flies so fast that Christmas Eve feels like one long magical night.',
    'Comet and Cupid are the best at landing on snowy rooftops.',
    'Santa\'s hat has a secret pocket for extra candy canes.'
  ];

  const REPLY_PARTS = {
    greetings: ['Dear {name},', 'Ho ho ho, {name}!', 'My dear friend {name},', 'Hello there, {name}!'],
    openers: [
      'Your letter arrived at the North Pole this morning, carried in by a very excited elf.',
      'Mrs. Claus spotted your letter first and brought it straight to my desk with a cup of cocoa.',
      'The mail elves said your letter was one of the neatest they have seen all year!',
      'I read your letter by the fire while the reindeer napped in the barn.'
    ],
    ageLines: ['{age} is a wonderful age. I remember when you were even smaller!', 'Being {age} is a very big deal, and you are growing up so well.', 'Imagine that, {age} already! The elves can hardly believe it.'],
    goodDeed: [
      'I heard all about how you {deed}. That kind of thing makes my belly jiggle with joy!',
      'The elves told me you {deed}. That went right to the top of my Nice notes.',
      'When I heard you {deed}, I wrote it down in my big golden book.'
    ],
    noDeed: ['My elves tell me you have been working hard at being kind this year.', 'I have been watching the Nice List, and I am proud of the way you keep trying your best.'],
    wishes: [
      'I have your wish list right here: {wishes}. The elves are already busy in the workshop.',
      'You asked for {wishes}. I have pinned your list to the big board in the workshop so the elves can see it.',
      'I shared your wishes for {wishes} with my head elf. She said, "Leave it with me, Santa!"'
    ],
    questionIntro: ['You asked me a great question!', 'Now, about your question.', 'And to answer your question:'],
    answers: [
      { keys: ['reindeer', 'rudolph', 'dasher', 'dancer', 'prancer', 'vixen', 'comet', 'cupid', 'donner', 'blitzen'], lines: ['The reindeer are doing wonderfully. Rudolph has been practicing his takeoffs, and Comet still thinks he is the fastest.', 'My reindeer love oats, carrots and a good belly scratch. They are training for the big night every day.'] },
      { keys: ['elf', 'elves'], lines: ['The elves are busy as bees! They sing while they work, which is why the workshop always sounds like a party.', 'My elves are small but mighty, and they never forget a name.'] },
      { keys: ['cookie', 'milk', 'snack', 'eat'], lines: ['I love all cookies, but a cookie made with love is my very favorite kind.', 'Milk and cookies keep me going all night long. The reindeer appreciate a carrot or two!'] },
      { keys: ['chimney', 'fireplace', 'house', 'apartment', 'get in'], lines: ['A little Christmas magic gets me inside every home, chimney or not.', 'No chimney? No problem! Santa\'s magic key works on every door, but only on Christmas Eve.'] },
      { keys: ['old', 'age', 'birthday'], lines: ['I am older than the tallest pine tree, but my heart feels as young as yours!', 'Mrs. Claus says I stopped counting birthdays a very long time ago.'] },
      { keys: ['how', 'fast', 'one night', 'everyone', 'whole world'], lines: ['It takes a lot of Christmas magic, a very fast sleigh and the best team of reindeer in the world.', 'Time works a little differently on Christmas Eve. That is all part of the magic.'] },
      { keys: ['snow', 'cold', 'north pole'], lines: ['It is snowy and cozy at the North Pole. The elves had a snowball fight just yesterday!', 'The North Pole is chilly, but the workshop is warm as toast.'] },
      { keys: ['mrs', 'wife'], lines: ['Mrs. Claus is wonderful! She bakes the best gingerbread and keeps the whole workshop running.'] },
      { keys: ['real', 'see you', 'meet'], lines: ['I am always closer than you think, especially when you are being kind.', 'You may not see me, but I promise I will be thinking of you on Christmas Eve.'] }
    ],
    defaultAnswers: ['That is such a thoughtful question that I am going to think about it on my sleigh ride!', 'Some things are part of the North Pole magic, but I love that you are curious.'],
    closers: ['Keep being kind, {name}, and remember to get a good night\'s sleep on Christmas Eve.', 'Remember, the best gifts are the kind things we do for each other.', 'Be sure to help your family this December. The elves notice everything!'],
    signoffs: ['With love and a jolly ho ho ho,', 'Your friend at the North Pole,', 'Merry Christmas and big hugs,'],
    postscripts: ['Rudolph says hello!', 'Don\'t forget the carrots for the reindeer.', 'Mrs. Claus says you are a star, {name}!', 'Keep an eye out for my elves. They are always watching for kindness.']
  };

  const WE_RULES = [
    'Everyone brings one wrapped gift within the budget. Keep it a mystery!',
    'Draw numbers (or let the app shuffle) to set the turn order.',
    'Player 1 opens a gift from the pile.',
    'Each next player either opens a new gift or steals an opened gift.',
    'If your gift is stolen, you can open a new gift or steal a different one (no instant steal-backs).',
    'A gift is "frozen" after it has been stolen the max number of times.',
    'When the last gift is opened, Player 1 gets one final chance to swap.'
  ];

  const DATA = { AGE_GROUPS, INTERESTS, GIFTS, ELEPHANT_IDEAS, ADVENT, ELF_MISSIONS, SANTA_STOPS, SANTA_FACTS, REPLY_PARTS, WE_RULES };
  if (typeof module !== 'undefined' && module.exports) module.exports = DATA;
  else root.SLH_DATA = DATA;
})(typeof window !== 'undefined' ? window : globalThis);
