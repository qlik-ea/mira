/**
 * Class providing a central repository for discovered QIX engine instances.
 */
class EngineList {

  /**
   * Creates new {@link EngineList}.
   */
  constructor() {
    this.entries = {};
  }

  /**
   * Returns all engines in list.
   * @returns The list of engines.
   */
  all() {
    return Object.keys(this.entries).map(key => this.entries[key]);
  }

  /**
   * Adds an engine to the list.
   * @param {string} key - The unique key of engine entry to add.
   * @param {EngineEntry} engine - The engine entry to add.
   */
  add(key, engine) {
    if (this.has(key)) { throw new Error('Key already exists'); }
    if (!engine) { throw new Error('Invalid engine parameter'); }
    this.entries[key] = engine;
  }

  /**
   * Deletes the given engine entry.
   * @param {string|string[]} arg - The key(s) to delete; either a single key or
   *                                an array of keys.
   */
  delete(arg) {
    const keys = Array.isArray(arg) ? arg : [arg];
    keys.forEach((key) => {
      if (this.has(key)) {
        this.entries[key].stopHealthChecks();
        delete this.entries[key];
      }
    });
  }

  /**
   * Returns the difference (i.e. the relative complement) between the list and
   * the supplied set of keys.
   * @param {string[]} keys - The set of keys.
   * @returns {string[]} All keys that are present in the list but missing in the
   *                     supplied set of keys.
   */
  difference(keys) {
    return Object.keys(this.entries).filter(key => !keys.includes(key));
  }

  /**
   * Filters the lists based on a given set of constraints. Engines that satisfies
   * the constraints will be included in the result.
   * @param {object} constraints - Property constraints to use for filtering.
   * @returns {EngineEntry[]} An array of engines satisfying the constraints.
   */
  filter(constraints) {
    return this.all().filter(engine => engine.satisfies(constraints));
  }

  /**
   * Checks if a given engine is already in the list.
   * @param {string} key - the unique engine identifier.
   * @returns true if engine is already in list, false otherwise.
   */
  has(key) {
    return Object.prototype.hasOwnProperty.call(this.entries, key);
  }
}

module.exports = EngineList;
