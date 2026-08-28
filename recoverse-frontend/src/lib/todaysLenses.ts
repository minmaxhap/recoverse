import { fnv1a32 } from '@recoverse/shared';
import { REVIEW_LENSES, type ReviewLensContent } from '../components/solo/reviewContent';

/** 첫 화면에 내미는 렌즈 수. 셋이면 훑지 않고 읽힌다. */
export const TODAYS_LENS_COUNT = 3;

/**
 * 오늘 권할 렌즈 몇 개를 고른다.
 *
 * 열두 개를 한 번에 펼치면 고르는 일 자체가 부담이 된다(선택 과부하). 그렇다고
 * 렌즈를 줄이면 다양함이 사라지므로, 오늘 볼 것만 앞에 두고 나머지는 접어 둔다.
 *
 * 날짜를 시드로 써서 하루 동안은 같은 셋이 나온다. 화면을 다시 열 때마다 추천이
 * 바뀌면 방금 본 렌즈를 다시 찾지 못하고, 고르는 일이 도박처럼 느껴진다.
 */
export function todaysLenses(todayISO: string, count = TODAYS_LENS_COUNT): readonly ReviewLensContent[] {
  const pool = [...REVIEW_LENSES];
  const picked: ReviewLensContent[] = [];
  // 시드를 하루에 한 번만 만들고 뽑을 때마다 굴린다 — 같은 렌즈가 두 번 들어가지 않게.
  let seed = fnv1a32(todayISO);
  while (picked.length < Math.min(count, REVIEW_LENSES.length)) {
    seed = fnv1a32(`${todayISO}:${picked.length}:${seed}`);
    picked.push(...pool.splice(seed % pool.length, 1));
  }
  return picked;
}
