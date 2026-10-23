/* Do It Yar — the paper garage (single source of truth for every page) */
(function () {
  const chapters = [
    { id: 'street', no: '01', name: 'Street legends', line: 'Your childhood posters grew up.', theme: 'city' },
    { id: 'circuit', no: '02', name: 'Circuit crew', line: 'Race-day attitude. Every day.', theme: 'circuit' },
    { id: 'after', no: '03', name: 'After hours', line: 'The vault is open. Act accordingly.', theme: 'vault' }
  ];

  // bay order = garage order. sound = what it says when it arrives. rev = engine synth profile.
  const raw = [
    { id: 'bmw-m3-gtr', face: 'l', ar: 1.657, make: 'BMW', model: 'M3 GTR', tag: 'Gaming / NFS icon', ch: 'street', slang: 'Most wanted', note: 'NFS energy. Offline edition.', line: 'The chase is over. Your next build is here.', sound: 'VROOM VROOM', rev: { base: 70, peak: 260, dur: 1.4, pops: 2 }, price: 999, deal: 15, level: 'Intermediate–Advanced', pages: 5, dims: '106 × 262 × 75 mm', sku: 'DIY-AUTO-BMWM3GTR-002', scale: '1:18', groups: ['gaming', 'track'], origin: 'Germany', year: 2001, accent: '#2f6fde', stock: 12 },
    { id: 'mitsubishi-evo-8-nfs-most-wanted', face: 'r', ar: 1.993, make: 'Mitsubishi', model: 'Evo VIII', tag: 'Gaming / JDM', ch: 'street', slang: 'Boost culture', note: 'No respawn. Just paper.', line: 'Boost your shelf. Lose yourself in the details.', sound: 'STU-TU-TU', rev: { base: 90, peak: 300, dur: 1.1, pops: 0, flutter: true }, price: 999, deal: 18, level: 'Intermediate–Advanced', pages: 5, dims: '106 × 248 × 78 mm', sku: 'DIY-AUTO-EVO8NFS-003', scale: '1:18', groups: ['gaming', 'jdm'], origin: 'Japan', year: 2003, accent: '#c5ef41', stock: 9 },
    { id: 'mazda-rx-7-abflug-anubis', face: 'l', ar: 2.037, make: 'Mazda', model: 'RX-7', sub: 'Abflug Anubis', tag: 'JDM / Tuner', ch: 'street', slang: 'Rotary energy', note: 'Built different. Literally.', line: 'Abflug Anubis. A whole different kind of curve.', sound: 'BRAP BRAP BRAP', rev: { base: 110, peak: 380, dur: 1.2, pops: 3, brap: true }, price: 949, deal: 15, level: 'Intermediate–Advanced', pages: 5, dims: '107 × 244 × 70 mm', sku: 'DIY-AUTO-RX7ANU-006', scale: '1:18', groups: ['jdm', 'tuner'], origin: 'Japan', year: 1992, accent: '#ff641f', stock: 11 },
    { id: 'nissan-skyline-r35', face: 'l', ar: 1.885, make: 'Nissan', model: 'Skyline R35', tag: 'JDM performance', ch: 'street', slang: 'Godzilla mode', note: 'Big presence. Small parking spot.', line: 'A monster of a build. A very good shelf problem.', sound: 'RAWWRRR', rev: { base: 60, peak: 240, dur: 1.5, pops: 1 }, price: 1099, deal: 25, level: 'Advanced', pages: 6, dims: '260 × 103 × 76 mm', sku: 'DIY-AUTO-NSR35-007', scale: '1:18', groups: ['jdm'], origin: 'Japan', year: 2007, accent: '#8a9bb3', stock: 6 },
    { id: 'toyota-supra-mk5', face: 'r', ar: 2.246, make: 'Toyota', model: 'Supra MK5', tag: 'JDM sports car', ch: 'street', slang: 'Supra szn', note: 'Vroom vroom. You know the rest.', line: 'Yes, it’s a Supra. Yes, you can build it.', sound: 'RATATATA', rev: { base: 80, peak: 280, dur: 1.1, pops: 6 }, price: 749, deal: 10, level: 'Intermediate', pages: 3, dims: '85 × 183 × 55 mm', sku: 'DIY-AUTO-SUPMK5-011', scale: '1:24', groups: ['jdm'], origin: 'Japan', year: 2019, accent: '#e3342f', stock: 18 },
    { id: 'mazda-787b', face: 'l', ar: 1.541, make: 'Mazda', model: '787B', tag: 'Le Mans / Motorsport', ch: 'circuit', slang: 'No lift', note: 'Race history. Rebuilt by hand.', line: 'An endurance icon. Now it’s your turn to put in the hours.', sound: 'NYEEEOWWW', rev: { base: 140, peak: 520, dur: 1.6, pops: 0 }, price: 999, deal: 15, level: 'Intermediate–Advanced', pages: 5, dims: '111 × 261 × 56 mm', sku: 'DIY-AUTO-MAZ787-009', scale: '1:18', groups: ['track', 'classic', 'jdm'], origin: 'Japan', year: 1991, accent: '#22a37a', stock: 10 },
    { id: 'bmw-m4-gt3', face: 'l', ar: 2.743, make: 'BMW', model: 'M4 GT3', tag: 'GT racing', ch: 'circuit', slang: 'Apex energy', note: 'Track attitude. Tabletop scale.', line: 'Find your line. Fold your next obsession.', sound: 'VRRM KLAK VRRM', rev: { base: 75, peak: 270, dur: 1.2, pops: 1, shift: true }, price: 849, deal: 10, level: 'Intermediate', pages: 4, dims: '87 × 209 × 58 mm', sku: 'DIY-AUTO-BMWM4GT3-010', scale: '1:24', groups: ['track'], origin: 'Germany', year: 2022, accent: '#2f6fde', stock: 14 },
    { id: 'audi-quattro-s1', face: 'l', ar: 1.963, make: 'Audi', model: 'Quattro S1', tag: 'Group B rally', ch: 'circuit', slang: 'Gravel goals', note: 'Dirt looks good on legends.', line: 'Boxy. Bold. Rally royalty in paper.', sound: 'PAH! PAH! PAH!', rev: { base: 85, peak: 300, dur: 1.2, pops: 5 }, price: 849, deal: 12, level: 'Intermediate', pages: 4, dims: '95 × 234 × 75 mm', sku: 'DIY-AUTO-AUDQS1-012', scale: '1:18', groups: ['classic', 'track'], origin: 'Germany', year: 1985, accent: '#f0f0ea', stock: 9 },
    { id: 'ferrari-f40', face: 'l', ar: 2.741, make: 'Ferrari', model: 'F40', tag: 'Classic supercar', ch: 'circuit', slang: 'Old school', note: 'Some legends never log off.', line: 'No chill. All icon. The poster car, off the wall.', sound: 'BWAAAAH', rev: { base: 95, peak: 360, dur: 1.3, pops: 2 }, price: 949, deal: 12, level: 'Intermediate–Advanced', pages: 5, dims: '109 × 231 × 58 mm', sku: 'DIY-AUTO-F40-004', scale: '1:18', groups: ['classic', 'tuner'], origin: 'Italy', year: 1987, accent: '#e3342f', stock: 5 },
    { id: 'lamborghini-huracan-sto', face: 'r', ar: 2.223, make: 'Lamborghini', model: 'Huracán STO', tag: 'Track supercar', ch: 'circuit', slang: 'Track menace', note: 'Shelf-ready. Race-inspired.', line: 'A little aero. A lot of main character energy.', sound: 'WAAAAANG', rev: { base: 120, peak: 440, dur: 1.4, pops: 1 }, price: 999, deal: 18, level: 'Intermediate–Advanced', pages: 5, dims: '122 × 250 × 67 mm', sku: 'DIY-AUTO-HURSTO-008', scale: '1:18', groups: ['track', 'hyper'], origin: 'Italy', year: 2021, accent: '#4fb6e8', stock: 8 },
    { id: 'lamborghini-aventador-lbwk', face: 'l', ar: 1.981, make: 'Lamborghini', model: 'Aventador', sub: 'LBWK', tag: 'Modified hypercar', ch: 'after', slang: 'Wide & wild', note: 'Wide body. Wider imagination.', line: 'Liberty Walk attitude. Your hands on the build.', sound: 'SKRRRRT', rev: { base: 100, peak: 420, dur: 1.4, pops: 2 }, price: 1099, deal: 20, level: 'Advanced', pages: 6, dims: '123 × 265 × 60 mm', sku: 'DIY-AUTO-AVLBK-001', scale: '1:18', groups: ['hyper', 'tuner'], origin: 'Italy', year: 2011, accent: '#e9e6df', stock: 7 },
    { id: 'bugatti-centodieci', face: 'l', ar: 1.442, make: 'Bugatti', model: 'Centodieci', tag: 'Hypercar', ch: 'after', slang: 'Rare energy', note: 'The details do the talking.', line: 'A statement piece for a shelf with standards.', sound: 'WHOOOOSH', rev: { base: 55, peak: 230, dur: 1.8, pops: 0, whoosh: true }, price: 999, deal: 22, level: 'Intermediate–Advanced', pages: 5, dims: '119 × 252 × 65 mm', sku: 'DIY-AUTO-BUGCEN-005', scale: '1:18', groups: ['hyper'], origin: 'France', year: 2019, accent: '#d9d9d4', stock: 4 },
    { id: 'rolls-royce-phantom', face: 'l', ar: 2.343, make: 'Rolls-Royce', model: 'Phantom', tag: 'Luxury', ch: 'after', slang: 'Quiet flex', note: 'A different kind of power move.', line: 'Less noise. More presence. Take your time with this one.', sound: 'SHHHHH.', rev: { base: 40, peak: 70, dur: 1.6, pops: 0, quiet: true }, price: 899, deal: 10, level: 'Intermediate', pages: 4, dims: '99 × 269 × 75 mm', sku: 'DIY-AUTO-RRPH-013', scale: '1:18', groups: ['classic', 'luxury'], origin: 'United Kingdom', year: 2017, accent: '#c6c3ff', stock: 6 },
    { id: 'hennessey-venom-f5', face: 'r', ar: 2.455, make: 'Hennessey', model: 'Venom F5', tag: 'Hypercar', ch: 'after', slang: 'Full send', note: 'Fast looks. Slow crafting.', line: 'Dream-garage energy. One careful fold at a time.', sound: 'ZOOOOOM', rev: { base: 65, peak: 330, dur: 1.5, pops: 1 }, price: 949, deal: 20, level: 'Intermediate–Advanced', pages: 5, dims: '105 × 251 × 59 mm', sku: 'DIY-AUTO-VENF5-014', scale: '1:18', groups: ['hyper'], origin: 'United States', year: 2020, accent: '#ff8a3d', stock: 5 },
    { id: 'devel-sixteen', face: 'r', ar: 1.773, make: 'Devel', model: 'Sixteen', tag: 'Concept hypercar', ch: 'after', slang: 'Final boss', note: 'Big imagination. Paper form.', line: 'Finish your garage with something properly unreal.', sound: 'KA-BOOOOM', rev: { base: 45, peak: 260, dur: 1.9, pops: 4 }, price: 1099, deal: 25, level: 'Advanced', pages: 6, dims: '126 × 294 × 67 mm', sku: 'DIY-AUTO-DEV16-015', scale: '1:18', groups: ['hyper'], origin: 'UAE', year: 2017, accent: '#c6c3ff', stock: 3 }
  ];

  // the real recordings behind every car (trimmed + levelled clips in assets/sound). exact = that very model;
  // otherwise the closest freely-licensed recording of the same engine family, said out loud.
  const C = 'https://commons.wikimedia.org/wiki/File:', FS = 'https://freesound.org/s/';
  const sounds = {
    'bmw-m3-gtr': { exact: 0, rec: 'BMW M3 GT2 (2010)', why: 'BMW Motorsport V8 race car, the M3 GTR’s direct descendant', by: 'Edvvc', lic: 'CC BY-SA 3.0', url: C + 'BMW_M3_GT2_(2010).ogg' },
    'mitsubishi-evo-8-nfs-most-wanted': { exact: 0, rec: 'Mitsubishi Lancer Evolution VI', why: 'same 4G63 turbo four as the Evo VIII', by: 'prone (YouTube), via Wikimedia Commons', lic: 'CC BY 3.0', url: C + 'Mitsubishi_Lancer_Evolution_VI_-_engine_and_exhaust_sound_(YouTube_p2UANOqploM).opus' },
    'mazda-rx-7-abflug-anubis': { exact: 0, rec: 'Ford Sierra RS Cosworth, tuned ~600 hp', why: 'no free rotary recording exists yet, so a big-turbo tuner car stands in', by: 'hggi.car (YouTube), via Wikimedia Commons', lic: 'CC BY 3.0', url: C + 'Ford_Sierra_RS_Cosworth_(tuned,_about_600_hp)_-_engine_and_exhaust_sound_(YouTube_7e3q50wwmNE).opus' },
    'nissan-skyline-r35': { exact: 1, rec: 'Nissan GT-R SpecV (R35)', by: 'Edvvc', lic: 'CC BY-SA 3.0', url: C + 'Nissan_GT-R_SpecV.ogg' },
    'toyota-supra-mk5': { exact: 0, rec: 'Toyota Supra (A80)', why: 'the Supra’s turbo straight-six, one generation earlier', by: 'Fabio Rojas Pichardo (YouTube), via Wikimedia Commons', lic: 'CC BY 3.0', url: C + 'Toyota_Supra_(A80)_-_engine_and_exhaust_sound_(YouTube_YlRjnMnHRO4).opus' },
    'mazda-787b': { exact: 0, rec: 'Ferrari 312PB (1972)', why: 'no free 4-rotor recording exists yet, so a screaming Le Mans-era prototype stands in', by: 'Edvvc', lic: 'CC BY-SA 3.0', url: C + 'Ferrari_312PB_(1972).ogg' },
    'bmw-m4-gt3': { exact: 0, rec: 'BMW M5 (F90)', why: 'BMW M twin-turbo power, same family as the GT3 car', by: 'mjrk.39 (YouTube), via Wikimedia Commons', lic: 'CC BY 3.0', url: C + 'BMW_M5_F90_-_engine_and_exhaust_sound_(YouTube_GMtRzIc0tP4).opus' },
    'audi-quattro-s1': { exact: 1, rec: 'Audi Sport Quattro S1 (1985)', by: 'Edvvc', lic: 'CC BY-SA 3.0', url: C + 'Audi_Sport_Quattro_S1_(1985).ogg' },
    'ferrari-f40': { exact: 0, rec: 'Ferrari F430 (2010)', why: 'Ferrari V8 from Maranello’s race department', by: 'Edvvc', lic: 'CC BY-SA 3.0', url: C + 'Ferrari_F430_(2010).ogg' },
    'lamborghini-huracan-sto': { exact: 0, rec: 'Lamborghini Gallardo LP570-4 Superleggera', why: 'the Huracán’s V10, one generation earlier', by: 'Edvvc', lic: 'CC BY-SA 3.0', url: C + 'Lamborghini_Gallardo_LP570-4_Superleggera.ogg' },
    'lamborghini-aventador-lbwk': { exact: 1, rec: 'Lamborghini Aventador LP700-4 (2011)', by: 'Edvvc', lic: 'CC BY-SA 3.0', url: C + 'Lamborghini_Aventador_LP700-4_(2011).ogg' },
    'bugatti-centodieci': { exact: 0, rec: 'Bugatti Veyron Pur Sang', why: 'the same quad-turbo W16 family', by: 'Edvvc', lic: 'CC BY-SA 3.0', url: C + 'Bugatti_Veyron_Pur_Sang.ogg' },
    'rolls-royce-phantom': { exact: 0, rec: 'Rolls-Royce idling', why: 'a real Rolls-Royce at idle (model not stated)', by: 'firefreak', lic: 'CC BY 3.0', url: FS + '56495/' },
    'hennessey-venom-f5': { exact: 0, rec: 'Koenigsegg Agera', why: 'twin-turbo V8 hypercar, the Venom’s closest relative on record', by: 'Edvvc', lic: 'CC BY-SA 3.0', url: C + 'Koenigsegg_Agera.ogg' },
    'devel-sixteen': { exact: 0, rec: 'Bugatti Veyron Grand Sport', why: 'quad-turbo sixteen-cylinder, like the Devel’s', by: 'Edvvc', lic: 'CC BY-SA 3.0', url: C + 'Bugatti_Veyron_Grand_Sport.ogg' }
  };
  const fxCredits = [
    { rec: 'scissors;snips', by: 'Abir19', lic: 'CC0', url: FS + '629513/' },
    { rec: 'Sound of scissors cutting papers', by: 'florianreichelt', lic: 'CC0', url: FS + '447153/' },
    { rec: 'Foley_Paper_Tearing', by: 'Nox_Sound', lic: 'CC0', url: FS + '529217/' },
    { rec: 'tear paper', by: 'edschaefer', lic: 'CC0', url: FS + '343098/' },
    { rec: 'ZIPPER', by: 'AndreaM84', lic: 'CC0', url: FS + '250586/' },
    { rec: 'RollerShutter_IT', by: 'uniuniversal', lic: 'CC0', url: FS + '617980/' },
    { rec: 'Garage Door Closes', by: 'dannydandanshababaloo', lic: 'CC0', url: FS + '593200/' },
    { rec: 'partypopper', by: 'Streety', lic: 'CC0', url: FS + '26349/' },
    { rec: 'Firecracker', by: 'SamsterBirdies', lic: 'CC0', url: FS + '506982/' },
    { rec: 'Firework Crackle', by: 'LukaCafuka', lic: 'CC0', url: FS + '750682/' }
  ];

  const views = ['front-three-quarter', 'side-profile', 'rear-three-quarter', 'overhead', 'paper-detail'];
  const labels = ['Front three-quarter', 'Side profile', 'Rear three-quarter', 'Overhead', 'Paper detail'];

  // every car stands as in its front-three-quarter studio photo: all four wheels down, its own floor shadow kept.
  // those photos all look left, so every car faces left; ar is each cutout's trimmed aspect.
  const AR = { 'bmw-m3-gtr': 1.801, 'mitsubishi-evo-8-nfs-most-wanted': 1.703, 'mazda-rx-7-abflug-anubis': 1.775, 'nissan-skyline-r35': 1.915, 'toyota-supra-mk5': 1.959, 'mazda-787b': 1.77, 'bmw-m4-gt3': 1.632, 'audi-quattro-s1': 1.734, 'ferrari-f40': 1.781, 'lamborghini-huracan-sto': 1.557, 'lamborghini-aventador-lbwk': 1.797, 'bugatti-centodieci': 1.992, 'rolls-royce-phantom': 1.9, 'hennessey-venom-f5': 2.145, 'devel-sixteen': 1.733 };
  const cars = raw.map((c, i) => {
    const slug = c.sku.toLowerCase();
    return Object.assign(c, {
      face: 'l', ar: AR[c.id] || c.ar,
      no: i + 1, bay: String(i + 1).padStart(2, '0'), type: 'car', category: 'automobiles',
      name: `${c.make} ${c.model}${c.sub ? ' ' + c.sub : ''}`,
      salePrice: Math.round(c.price * (1 - c.deal / 100) / 10) * 10 - 1,
      time: `${c.pages} A4 pattern sheets`,
      buildHours: Math.round(c.pages * 1.6 + (c.level === 'Advanced' ? 2 : 0)),
      length: Math.max(...c.dims.split('×').map(s => parseInt(s, 10))),
      chapter: chapters.find(x => x.id === c.ch),
      shout: /[.!?]$/.test(c.sound) ? c.sound : c.sound + '!',
      description: `Build the ${c.make} ${c.model}${c.sub ? ' ' + c.sub : ''} as a shelf-ready ${c.scale} paper model. Cut, score and assemble ${c.pages} A4 pattern sheets into a detailed display piece.`,
      gallery: views.map((v, n) => ({
        src: `assets/cars/${c.id}/${slug}-0${n + 1}-${v}.${c.id === 'lamborghini-aventador-lbwk' && n === 4 ? 'png' : 'webp'}`,
        label: labels[n]
      })),
      cut: `assets/stand/${c.id}.webp`,      // lifted off the studio paper, floor shadow kept
      thumb: `assets/stand/sm/${c.id}.webp`,  // 800px version for cards and pickers
      side: `assets/side/${c.id}.webp`,    // side profile sprite, always nose-left
      cutout: `assets/stand/${c.id}.webp`,
      href: `products/${c.id}/index.html`,
      credit: 'Papercraft design by Wong Hidayat (Wongday). Physical DIY kit by Do It Yar.',
      snd: sounds[c.id], vol: c.id === 'rolls-royce-phantom' ? .7 : 1
    });
  });

  const groups = {
    all: 'Full lineup', jdm: 'JDM legends', hyper: 'Hypercars', track: 'Track & motorsport',
    gaming: 'Gaming icons', classic: 'Classics & luxury', tuner: 'Widebody & tuner'
  };
  const vibes = [
    { id: 'jdm', name: 'JDM legends', line: 'Rotaries, turbos and posters you had in school.', car: 'toyota-supra-mk5', color: '#ff641f' },
    { id: 'hyper', name: 'Hypercars', line: 'Unreasonable machines. Very reasonable prices.', car: 'bugatti-centodieci', color: '#c6c3ff' },
    { id: 'track', name: 'Track & motorsport', line: 'Le Mans, Group B and pit-lane attitude.', car: 'mazda-787b', color: '#c5ef41' },
    { id: 'gaming', name: 'Gaming icons', line: 'Most wanted. Now buildable.', car: 'bmw-m3-gtr', color: '#b9ecd7' },
    { id: 'classic', name: 'Classics & luxury', line: 'Poster cars and quiet flexes.', car: 'ferrari-f40', color: '#f6c3d4' },
    { id: 'tuner', name: 'Widebody & tuner', line: 'Wide arches. Wider grins.', car: 'lamborghini-aventador-lbwk', color: '#f7f5ef' }
  ];

  // garage combos: three cars, bundle pricing (12% off the week's prices)
  const combos = [
    { id: 'jdm', name: 'JDM trio', line: 'Rotary, turbo, Godzilla.', cars: ['toyota-supra-mk5', 'mazda-rx-7-abflug-anubis', 'nissan-skyline-r35'] },
    { id: 'wanted', name: 'Most wanted', line: 'The chase, rebuilt on your shelf.', cars: ['bmw-m3-gtr', 'mitsubishi-evo-8-nfs-most-wanted', 'nissan-skyline-r35'] },
    { id: 'raceday', name: 'Race day', line: 'Le Mans, GT3 and Group B.', cars: ['mazda-787b', 'bmw-m4-gt3', 'audi-quattro-s1'] },
    { id: 'poster', name: 'Poster wall', line: 'The bedroom-wall heroes.', cars: ['ferrari-f40', 'lamborghini-aventador-lbwk', 'lamborghini-huracan-sto'] },
    { id: 'hyper', name: 'Hyper hat-trick', line: 'Three unreasonable machines.', cars: ['bugatti-centodieci', 'hennessey-venom-f5', 'devel-sixteen'] },
    { id: 'quiet', name: 'Quiet flex', line: 'For shelves with standards.', cars: ['rolls-royce-phantom', 'bugatti-centodieci', 'ferrari-f40'] }
  ].map(k => {
    const list = k.cars.map(id => cars.find(c => c.id === id));
    const sale = list.reduce((s, c) => s + c.salePrice, 0), mrp = list.reduce((s, c) => s + c.price, 0);
    return Object.assign(k, { list, mrp, price: Math.round(sale * .88) });
  });

  window.DIY = { cars, all: cars, chapters, groups, vibes, combos, fxCredits };
})();
