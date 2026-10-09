/**
 * Classes for the controls of a prototype `.field`: a 1.5px border that turns
 * purple on focus, without shadcn's ring.
 *
 * It is a constant and not a component because `input`, `select` and
 * `textarea` share it, and wrapping each in its own component just to repeat
 * this string would be a middleman with no work of its own.
 */
export const FIELD_CONTROL =
  'w-full rounded-md border-[1.5px] border-gray-200 bg-white px-3 py-2 text-[13px] text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-brand-600 disabled:opacity-50';
