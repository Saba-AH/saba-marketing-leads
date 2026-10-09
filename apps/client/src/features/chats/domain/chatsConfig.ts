/**
 * The customer sees "typing…" while an agent replies from the panel. Meta ties
 * it to marking their last message as read (blue ticks): with `false` the panel
 * tells Meta nothing and the customer sees neither until the reply arrives.
 */
export const SHOW_TYPING_TO_CUSTOMER = true;

/** Meta shows it for up to 25 s: notifying more often wastes calls. */
export const TYPING_NOTICE_INTERVAL_MS = 20_000;
