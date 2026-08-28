/**
 * 책장에 몇 번째로 꽂히는 호인지를 부르는 이름.
 *
 * 연속 기록(스트릭)은 쓰지 않는다. 회고는 건너뛴 주가 있는 게 정상인데 그걸 실패로
 * 표시하면 죄책감이 남고, 죄책감은 다음 호를 더 미루게 만든다. 호수는 한 번 쌓이면
 * 줄지 않으므로, 쉬어도 잃는 것이 없는 진행이 된다.
 */
export function issueNumberLabel(no: number): string {
  if (!Number.isFinite(no) || no < 1) return '이번 호';
  return no === 1 ? '창간호' : `제${no}호`;
}
