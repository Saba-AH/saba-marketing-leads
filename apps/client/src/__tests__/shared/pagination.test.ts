import {
  countPages,
  ITEMS_PER_PAGE,
  visiblePages,
} from '@/shared/domain/pagination';

describe('countPages', () => {
  it('an empty list is still one page, not zero', () => {
    // With zero pages there would be nowhere to show the empty state.
    expect(countPages(0)).toBe(1);
  });

  it('a list that fits exactly does not open an extra page', () => {
    expect(countPages(ITEMS_PER_PAGE)).toBe(1);
    expect(countPages(ITEMS_PER_PAGE + 1)).toBe(2);
  });
});

describe('visiblePages', () => {
  it('with few pages it shows them all, without ellipsis', () => {
    expect(visiblePages(1, 5)).toEqual([1, 2, 3, 4, 5]);
  });

  it('in the middle of many, it trims on both sides', () => {
    expect(visiblePages(10, 20)).toEqual([
      1,
      'ellipsis',
      9,
      10,
      11,
      'ellipsis',
      20,
    ]);
  });

  it('near the start it does not put an ellipsis that hides a single page', () => {
    expect(visiblePages(2, 20)).toEqual([1, 2, 3, 'ellipsis', 20]);
  });

  it('near the end, same', () => {
    expect(visiblePages(19, 20)).toEqual([1, 'ellipsis', 18, 19, 20]);
  });

  it('the control width does not grow with the data', () => {
    const inAThousand = visiblePages(500, 1000);
    expect(inAThousand.length).toBeLessThanOrEqual(7);
  });
});
