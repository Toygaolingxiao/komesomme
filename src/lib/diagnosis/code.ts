import {
  COOKER_KEYS,
  DISH_KEYS,
  TEXTURE_KEYS,
  type CookerKey,
  type DiagnosisAnswers,
  type DishKey,
  type TextureKey,
} from "@/lib/diagnosis/questions";
import { DEFAULT_BASE_ID } from "@/lib/diagnosis/engine";

/**
 * Answer ⇄ URL code (spec §4.1): `v1.<dish>.<base>.<tex>.<cooker>`.
 * The code is the entire state of a result — no database, no personal data.
 * Brand ids only contain [a-z0-9-], so dot-splitting is unambiguous.
 * "avg" means the default base (baseIsDefault); a user whose actual base
 * resolved to koshihikari-bl encodes the id itself, keeping the two apart.
 */

const CODE_VERSION = "v1";
const AVG = "avg";
const BASE_ID_PATTERN = /^[a-z0-9-]+$/;

export function encodeDiagnosisCode(answers: DiagnosisAnswers): string {
  const basePart = answers.baseIsDefault ? AVG : answers.baseId;
  return [
    CODE_VERSION,
    answers.dish,
    basePart,
    answers.tex,
    answers.cooker,
  ].join(".");
}

export function decodeDiagnosisCode(
  code: string,
  validBrandIds: ReadonlySet<string>,
): DiagnosisAnswers | null {
  const parts = code.split(".");
  if (parts.length !== 5 || parts[0] !== CODE_VERSION) return null;
  const [, dish, basePart, tex, cooker] = parts;
  if (!(DISH_KEYS as string[]).includes(dish)) return null;
  if (!(TEXTURE_KEYS as string[]).includes(tex)) return null;
  if (!(COOKER_KEYS as string[]).includes(cooker)) return null;

  const dishKey = dish as DishKey;
  const texKey = tex as TextureKey;
  const cookerKey = cooker as CookerKey;

  if (basePart === AVG) {
    return {
      dish: dishKey,
      baseId: DEFAULT_BASE_ID,
      baseIsDefault: true,
      tex: texKey,
      cooker: cookerKey,
    };
  }
  if (!BASE_ID_PATTERN.test(basePart) || !validBrandIds.has(basePart)) {
    return null;
  }
  return {
    dish: dishKey,
    baseId: basePart,
    baseIsDefault: false,
    tex: texKey,
    cooker: cookerKey,
  };
}
