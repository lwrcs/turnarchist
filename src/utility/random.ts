export class Random {
  static state: number;

  static setState = (state: number) => {
    Random.state = state;
  };

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
