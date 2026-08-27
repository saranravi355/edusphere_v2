/**
 * The school's transport network, as data.
 *
 * `/operations/transport` and `/parent/transport` were built and tested in
 * August but hold nothing: TransportRoute, TransportStop and StudentTransport
 * are all empty, so every transport screen renders its empty state. This file
 * is the fleet that fills them.
 *
 * Kept separate from `seed-transport.mjs` so the school can correct a driver's
 * phone number or a pickup time by editing a list, without reading any logic.
 *
 * Geography is real. The campus sits in the Whitefield/Varthur belt, and the
 * eight routes are the corridors families in east and south Bengaluru actually
 * travel: stops are in genuine pickup order, farthest first, converging on an
 * ~08:05 arrival. Drop times run the sequence in reverse from an ~15:15 bell.
 *
 * Capacities are deliberately mixed. A school of 173 does not run eight
 * 40-seaters; it runs Tempo Travellers and small buses, and the sparse northern
 * routes run the smallest. Route 1 is sized at 20 for 18 riders, so the
 * "route is full" check in assignRider() is reachable with two more children.
 */

/** Stops carry the locality they serve, so a rider's address can match the bus they are on. */
export const ROUTES = [
  {
    name: "Route 1 — Whitefield & Hope Farm",
    vehicleNumber: "KA-03-AC-4412",
    driverName: "Ramesh Gowda",
    driverPhone: "+91 98450 21174",
    capacity: 20,
    riders: 18,
    stops: [
      { name: "Kadugodi Tree Park",     pickupTime: "07:20", dropTime: "15:45", area: "Kadugodi",   pin: "560067", streets: ["Sathya Sai Layout", "Channasandra Main Road", "Vydehi Nagar"] },
      { name: "Hope Farm Junction",     pickupTime: "07:28", dropTime: "15:38", area: "Whitefield", pin: "560066", streets: ["Sadaramangala Road", "Immadihalli Main Road", "Nallurhalli Road"] },
      { name: "ITPL Main Road",         pickupTime: "07:36", dropTime: "15:30", area: "Whitefield", pin: "560066", streets: ["Pattandur Agrahara", "Prestige Shantiniketan", "EPIP Zone"] },
      { name: "Palm Meadows Gate",      pickupTime: "07:43", dropTime: "15:24", area: "Whitefield", pin: "560066", streets: ["Palm Meadows", "Ramagondanahalli Road", "Whitefield Main Road"] },
      { name: "Varthur Kodi",           pickupTime: "07:52", dropTime: "15:16", area: "Varthur",    pin: "560087", streets: ["Gunjur Palya Road", "Varthur Main Road", "Siddapura Layout"] },
    ],
  },
  {
    name: "Route 2 — Marathahalli & Brookefield",
    vehicleNumber: "KA-03-AC-4418",
    driverName: "Shivakumar N",
    driverPhone: "+91 98452 66031",
    capacity: 24,
    riders: 17,
    stops: [
      { name: "Kundalahalli Gate",      pickupTime: "07:15", dropTime: "15:50", area: "Kundalahalli",  pin: "560037", streets: ["Brigade Metropolis", "AECS Layout A Block", "Kundalahalli Main Road"] },
      { name: "Brookefield Mall",       pickupTime: "07:23", dropTime: "15:42", area: "Brookefield",   pin: "560037", streets: ["ITPL Road", "Kundalahalli Colony", "Graphite India Road"] },
      { name: "AECS Layout",            pickupTime: "07:31", dropTime: "15:35", area: "AECS Layout",   pin: "560037", streets: ["AECS Layout B Block", "Doddanekkundi Main Road", "Chinnappa Layout"] },
      { name: "Marathahalli Bridge",    pickupTime: "07:40", dropTime: "15:27", area: "Marathahalli",  pin: "560037", streets: ["Marathahalli Outer Ring Road", "Ambedkar Nagar", "Karthik Nagar"] },
      { name: "Munnekolala",            pickupTime: "07:48", dropTime: "15:19", area: "Munnekolala",   pin: "560037", streets: ["Munnekolala Main Road", "Sri Sai Layout", "Doddanekkundi Extension"] },
    ],
  },
  {
    name: "Route 3 — Indiranagar & Domlur",
    vehicleNumber: "KA-01-AB-7729",
    driverName: "Prakash Reddy",
    driverPhone: "+91 99860 41287",
    capacity: 18,
    riders: 12,
    stops: [
      { name: "CV Raman Nagar",         pickupTime: "06:55", dropTime: "16:05", area: "CV Raman Nagar", pin: "560093", streets: ["Kaggadasapura Main Road", "Jeevan Bima Nagar", "Bagmane Tech Park Road"] },
      { name: "Indiranagar 100 Feet Road", pickupTime: "07:05", dropTime: "15:56", area: "Indiranagar", pin: "560038", streets: ["12th Main Road", "Defence Colony", "CMH Road"] },
      { name: "Domlur Flyover",         pickupTime: "07:14", dropTime: "15:48", area: "Domlur",        pin: "560071", streets: ["Domlur 2nd Stage", "Amarjyoti Layout", "Old Airport Road"] },
      { name: "Murugeshpalya",          pickupTime: "07:22", dropTime: "15:40", area: "Murugeshpalya", pin: "560017", streets: ["Konena Agrahara", "Suranjan Das Road", "Vimanapura Road"] },
      { name: "Mahadevapura",           pickupTime: "07:38", dropTime: "15:26", area: "Mahadevapura",  pin: "560048", streets: ["Garudachar Palya", "Hoodi Circle Road", "Mahadevapura Main Road"] },
    ],
  },
  {
    name: "Route 4 — Koramangala & HSR Layout",
    vehicleNumber: "KA-01-AB-7734",
    driverName: "Anil Kumar M",
    driverPhone: "+91 98803 55914",
    capacity: 24,
    riders: 16,
    stops: [
      { name: "Koramangala 4th Block",  pickupTime: "06:50", dropTime: "16:10", area: "Koramangala", pin: "560034", streets: ["80 Feet Road", "Jyoti Nivas College Road", "5th Block 1st Cross"] },
      { name: "Sony World Junction",    pickupTime: "06:58", dropTime: "16:02", area: "Koramangala", pin: "560095", streets: ["6th Block Main Road", "Koramangala 7th Block", "Ejipura Main Road"] },
      { name: "HSR Layout Sector 2",    pickupTime: "07:10", dropTime: "15:52", area: "HSR Layout",  pin: "560102", streets: ["27th Main Road", "Sector 2 14th Cross", "BDA Complex Road"] },
      { name: "Agara Lake (Sector 7)",  pickupTime: "07:18", dropTime: "15:44", area: "HSR Layout",  pin: "560102", streets: ["Sector 7 Main Road", "Agara Village Road", "Somasundarapalya"] },
      { name: "Iblur Junction",         pickupTime: "07:30", dropTime: "15:34", area: "Iblur",       pin: "560103", streets: ["Iblur Village Road", "Sakthi Nagar", "Green Glen Layout"] },
    ],
  },
  {
    name: "Route 5 — Sarjapur Road & Bellandur",
    vehicleNumber: "KA-51-AD-2260",
    driverName: "Manjunath S",
    driverPhone: "+91 97400 18862",
    capacity: 24,
    riders: 17,
    stops: [
      { name: "Dommasandra Circle",     pickupTime: "07:00", dropTime: "16:00", area: "Dommasandra",       pin: "560087", streets: ["Sarjapur Main Road", "Muthanallur Cross", "Chikkanayakanahalli Road"] },
      { name: "Carmelaram",             pickupTime: "07:10", dropTime: "15:51", area: "Carmelaram",        pin: "560035", streets: ["Dodda Kannelli Road", "Gunjur Main Road", "Halanayakanahalli"] },
      { name: "Kaikondrahalli",         pickupTime: "07:18", dropTime: "15:43", area: "Kaikondrahalli",    pin: "560035", streets: ["Junnasandra Road", "Ambalipura Main Road", "Haralur Road"] },
      { name: "Bellandur Gate",         pickupTime: "07:28", dropTime: "15:34", area: "Bellandur",         pin: "560103", streets: ["Bellandur Village Road", "Kariyammana Agrahara", "Yemalur Main Road"] },
      { name: "Ecospace",               pickupTime: "07:36", dropTime: "15:26", area: "Devarabisanahalli", pin: "560103", streets: ["Panathur Main Road", "Kadubeesanahalli", "Outer Ring Road Service Lane"] },
    ],
  },
  {
    name: "Route 6 — Electronic City & BTM",
    vehicleNumber: "KA-41-AE-3308",
    driverName: "Venkatesh Rao",
    driverPhone: "+91 96866 27340",
    capacity: 18,
    riders: 11,
    stops: [
      { name: "Electronic City Phase 1", pickupTime: "06:30", dropTime: "16:25", area: "Electronic City", pin: "560100", streets: ["Neeladri Road", "Doddathoguru Main Road", "Konappana Agrahara"] },
      { name: "Bommanahalli",            pickupTime: "06:45", dropTime: "16:12", area: "Bommanahalli",    pin: "560068", streets: ["Hosur Main Road", "Mangammanapalya Road", "Begur Road"] },
      { name: "BTM Layout 2nd Stage",    pickupTime: "06:57", dropTime: "16:01", area: "BTM Layout",      pin: "560076", streets: ["16th Main Road", "Tavarekere Main Road", "BTM 1st Stage 8th Cross"] },
      { name: "Silk Board Junction",     pickupTime: "07:06", dropTime: "15:53", area: "Bommanahalli",    pin: "560068", streets: ["Roopena Agrahara", "Central Silk Board Colony", "Jakkasandra Extension"] },
      { name: "Kudlu Gate",              pickupTime: "07:16", dropTime: "15:44", area: "Kudlu",           pin: "560068", streets: ["Kudlu Main Road", "Parappana Agrahara Road", "Singasandra"] },
    ],
  },
  {
    name: "Route 7 — Hebbal & Yelahanka",
    vehicleNumber: "KA-50-AF-1195",
    driverName: "Basavaraj Patil",
    driverPhone: "+91 99011 74526",
    capacity: 18,
    riders: 8,
    stops: [
      { name: "Yelahanka New Town",     pickupTime: "06:25", dropTime: "16:30", area: "Yelahanka",         pin: "560064", streets: ["Judicial Layout", "Attur Layout", "5th Phase Yelahanka"] },
      { name: "Jakkur",                 pickupTime: "06:38", dropTime: "16:18", area: "Jakkur",            pin: "560064", streets: ["Jakkur Plantation Road", "Amruthahalli Main Road", "Sampigehalli"] },
      { name: "Hebbal Flyover",         pickupTime: "06:50", dropTime: "16:07", area: "Hebbal",            pin: "560024", streets: ["Hebbal Kempapura", "Ganganagar Cross", "Bellary Road Service Lane"] },
      { name: "Nagawara",               pickupTime: "07:02", dropTime: "15:56", area: "Nagawara",          pin: "560045", streets: ["Arabic College Road", "Manyata Tech Park Road", "Veerannapalya"] },
      { name: "Banaswadi",              pickupTime: "07:15", dropTime: "15:44", area: "Banaswadi",         pin: "560043", streets: ["Kammanahalli Main Road", "HRBR Layout", "Horamavu Agara Road"] },
      { name: "Ramamurthy Nagar",       pickupTime: "07:26", dropTime: "15:34", area: "Ramamurthy Nagar",  pin: "560016", streets: ["Dodda Banaswadi Road", "Vijinapura", "Medahalli Cross"] },
    ],
  },
  {
    name: "Route 8 — Jayanagar & JP Nagar",
    vehicleNumber: "KA-05-AG-6641",
    driverName: "Suresh Babu K",
    driverPhone: "+91 98444 90218",
    capacity: 18,
    riders: 9,
    stops: [
      { name: "JP Nagar 6th Phase",     pickupTime: "06:40", dropTime: "16:18", area: "JP Nagar",         pin: "560078", streets: ["Puttenahalli Main Road", "Brigade Millennium Road", "24th Main Road"] },
      { name: "Jayanagar 4th Block",    pickupTime: "06:52", dropTime: "16:06", area: "Jayanagar",        pin: "560011", streets: ["11th Main Road", "East End Road", "Ashoka Pillar Road"] },
      { name: "IIM Bangalore",          pickupTime: "07:02", dropTime: "15:57", area: "Bannerghatta Road", pin: "560076", streets: ["Bilekahalli", "Hulimavu Gate", "Arekere Mico Layout"] },
      { name: "Adugodi",                pickupTime: "07:13", dropTime: "15:47", area: "Adugodi",          pin: "560030", streets: ["Dairy Circle Road", "Suddaguntepalya", "Lakkasandra Extension"] },
      { name: "Madiwala",               pickupTime: "07:22", dropTime: "15:38", area: "Madiwala",         pin: "560068", streets: ["Madiwala Market Road", "Jakkasandra 1st Block", "Venkatapura Main Road"] },
    ],
  },
];

/**
 * Where the children who do not take a bus live.
 *
 * Overwhelmingly within a few kilometres of the campus — which is exactly why
 * their families drive them — so this pool is the Whitefield belt rather than
 * the whole city.
 */
export const WALK_IN_AREAS = [
  { area: "Whitefield",     pin: "560066", streets: ["Nallurhalli Road", "Prestige Ozone", "Borewell Road"] },
  { area: "Varthur",        pin: "560087", streets: ["Varthur Main Road", "Gunjur Village Road", "Panathur Cross"] },
  { area: "Hoodi",          pin: "560048", streets: ["Hoodi Main Road", "Sadaramangala Industrial Area", "Channasandra Layout"] },
  { area: "Doddanekkundi",  pin: "560037", streets: ["Doddanekkundi Main Road", "Vibgyor Layout", "Garudacharpalya"] },
  { area: "Kundalahalli",   pin: "560037", streets: ["Kundalahalli Gate Road", "Whitefield Main Road", "Sri Sai Layout"] },
  { area: "Bellandur",      pin: "560103", streets: ["Kariyammana Agrahara", "Devarabisanahalli Road", "Yemalur Main Road"] },
  { area: "Kadugodi",       pin: "560067", streets: ["Channasandra Main Road", "Seegehalli Road", "Bhoruka Tech Park Road"] },
  { area: "Brookefield",    pin: "560037", streets: ["ITPL Road", "Munnekolala Main Road", "Kundalahalli Colony"] },
];

/** The address every student was seeded with. Anything matching this is fair game to replace. */
export const PLACEHOLDER_ADDRESS = /^\s*123 School Lane,\s*City\s*$/i;

/**
 * A stable Bengaluru address for a student.
 *
 * Deterministic in `i` rather than random, so re-running the seed produces the
 * same address for the same child and the script stays genuinely idempotent.
 */
export function addressFor(place, i) {
  const street = place.streets[i % place.streets.length];
  const door = i % 3 === 0
    ? `Flat ${((i * 3) % 6) + 1}0${(i % 4) + 1}`
    : `No. ${((i * 7) % 180) + 1}`;
  return `${door}, ${street}, ${place.area}, Bengaluru ${place.pin}`;
}
