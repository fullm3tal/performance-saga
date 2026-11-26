/**
 * PERF-15 demo: a pretend "get profile" API. Each person's reply takes a
 * different, fixed time, so you can reliably make a slow reply arrive AFTER
 * a fast one, which is exactly how real network races happen.
 */

type Profile = { name: string; city: string; emoji: string };

const PROFILES: Record<string, Profile> = {
  Alice: { name: "Alice", city: "Delhi", emoji: "👩" },
  Bob: { name: "Bob", city: "Mumbai", emoji: "👨" },
  Chen: { name: "Chen", city: "Pune", emoji: "🧑" },
};

/** How long each reply takes. Alice's server is slow today. */
const REPLY_MS: Record<string, number> = { Alice: 2500, Bob: 500, Chen: 1200 };

const PEOPLE = Object.keys(PROFILES);

function fetchProfile(name: string): Promise<Profile> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(PROFILES[name]), REPLY_MS[name]);
  });
}

export { PEOPLE, REPLY_MS, fetchProfile };
export type { Profile };
