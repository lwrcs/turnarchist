export class Random {
  static state: number;

  static setState = (state: number) => {
    Random.state = state;
  };

  /**
   * Generates a pseudorandom floating-point number using a xorshift algorithm.
   *
   * This method implements a 32-bit xorshift PRNG that modifies the internal state
   * using three XOR operations with bit shifts (21 left, 35 right, 4 left).
   * The algorithm is fast and suitable for games but should not be used for
   * cryptographic purposes.
   *
   * @returns {number} A pseudorandom floating-point number in the range [0, 1).
   *                   The value is uniformly distributed across this range.
   *
   * @example
   * Random.setState(12345); // Set initial seed
   * const randomValue = Random.rand(); // Returns something like 0.7234567891
   *
   * @see https://en.wikipedia.org/wiki/Xorshift for algorithm details
   */
  static rand = () => {
    Random.state ^= Random.state << 21;
    Random.state ^= Random.state >>> 35;
    Random.state ^= Random.state << 4;
    return (Random.state >>> 0) / 4294967296;
  };
}

// copy and paste into browser console
// let state;
// let rand = () => { state ^= (state << 21); state ^= (state >>> 35); state ^= (state << 4); return (state >>> 0) / 4294967296; }
