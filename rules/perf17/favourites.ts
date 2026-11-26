/**
 * PERF-17 demo data: the user's favourite contacts, already stored the way
 * a normalized store keeps them: an object keyed by contact id.
 * Because it's already keyed, "is X a favourite?" is a direct lookup:
 * favouritesByID[id]. No Set or Map needed.
 */

type Contact = { id: string; name: string };

/** Big enough that building a copy of the ids costs real time on a phone. */
const FAVOURITE_COUNT = 20_000;

function makeFavouritesByID(count: number): Record<string, Contact> {
  const byID: Record<string, Contact> = {};
  for (let index = 0; index < count; index += 1) {
    const id = `contact-${index}`;
    byID[id] = { id, name: `Contact ${index}` };
  }
  return byID;
}

const FAVOURITES_BY_ID = makeFavouritesByID(FAVOURITE_COUNT);

/** The contact whose profile the demo screen shows. */
const ASHA: Contact = { id: "contact-4321", name: "Asha" };

/** Demo-only: how much work each version did building lookups. */
const lookupStats = {
  withSet: { idsCopied: 0, ms: 0 },
  direct: { idsCopied: 0, ms: 0 },
};

function resetLookupStats() {
  lookupStats.withSet = { idsCopied: 0, ms: 0 };
  lookupStats.direct = { idsCopied: 0, ms: 0 };
}

// ❌ Copies every id into a new Set, just to ask about one id.
function isFavouriteViaSet(favouritesByID: Record<string, Contact>, contactID: string) {
  const start = performance.now();
  const favouriteIDs = new Set(Object.keys(favouritesByID));
  lookupStats.withSet.idsCopied += favouriteIDs.size;
  const answer = favouriteIDs.has(contactID);
  lookupStats.withSet.ms += performance.now() - start;
  return answer;
}

// ✅ The object is already keyed by id, so just look the id up.
function isFavouriteDirect(favouritesByID: Record<string, Contact>, contactID: string) {
  const start = performance.now();
  const answer = !!favouritesByID[contactID];
  lookupStats.direct.ms += performance.now() - start;
  return answer;
}

export { ASHA, FAVOURITE_COUNT, FAVOURITES_BY_ID, isFavouriteDirect, isFavouriteViaSet, lookupStats, resetLookupStats };
export type { Contact };
