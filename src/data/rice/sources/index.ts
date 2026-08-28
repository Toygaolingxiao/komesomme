import type { RiceSource } from "@/types/rice";
import { chugokuShikoku } from "./chugokuShikoku";
import { hokkaidoTohoku } from "./hokkaidoTohoku";
import { kansai } from "./kansai";
import { kantoKoshinetsu } from "./kantoKoshinetsu";
import { kyushuOkinawa } from "./kyushuOkinawa";
import { national } from "./national";
import { tokaiHokuriku } from "./tokaiHokuriku";

/**
 * Hand-authored rice sources, split by region purely for readability.
 *
 * Files live under `src/data/rice/sources/`. `deriveRiceProfile` fills in the
 * rule-derived fields, so entries here only carry brand-specific judgements.
 */
export const riceSources: RiceSource[] = [
  ...hokkaidoTohoku,
  ...kantoKoshinetsu,
  ...tokaiHokuriku,
  ...kansai,
  ...chugokuShikoku,
  ...kyushuOkinawa,
  ...national,
];

export {
  chugokuShikoku,
  hokkaidoTohoku,
  kansai,
  kantoKoshinetsu,
  kyushuOkinawa,
  national,
  tokaiHokuriku,
};
