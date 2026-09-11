# Real-game teaching interface

## First delivery

Show the existing teaching simulation with normal game artwork. Switch between
Game and Agent grid without reloading or moving the iframe. Both views share the
same run, restricted policy observations, input owner and saved action history.
The human may see more than the policy; record the display choice on human actions.

Keep an input surface above the game so native handlers cannot bypass recording.
Route movement keys and inventory shortcuts through Session.human. Retain explicit
inventory, targeting and menu controls below the game. Pause, takeover, single-step,
save failures and agent help requests keep their existing ownership rules.

## Follow-up

Bridge native inventory clicks, drag/drop, targeting and menus to the same action
interface before enabling those native handlers. Local presentation actions (zoom,
inventory visibility) need separation from game mutations. Test each interaction
against recorded before/after observations and zero-turn action costs.

An optional perception overlay can follow: remembered contacts, identification
limits and threats. It must not replace ordinary game artwork or reveal extra
information to policy inference. Training remains a separate step after recording.

## Acceptance checks

View switches preserve the same iframe and action count. Human movement is recorded
once, inactive input does nothing, two runs remain isolated, and switching runs
revokes human ownership. Normal timing resumes on takeover. Verify narrow layout,
exports, menu actions and ordinary play separately.
