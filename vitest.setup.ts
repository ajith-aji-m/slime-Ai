// idb-keyval (used by the local conversation store) needs a real IndexedDB;
// jsdom doesn't ship one, so polyfill it for the whole test run.
import "fake-indexeddb/auto";
