import type { LoadContext, SaveContext } from "../context";

export type SaveCodec<TRuntime, TSave> = {
  save: (value: TRuntime, ctx: SaveContext) => TSave;
  load: (value: TSave, ctx: LoadContext) => TRuntime;
};


