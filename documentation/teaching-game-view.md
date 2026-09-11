# Real-game teaching interface

## First delivery

Show the existing teaching simulation with normal game artwork. Switch between
Game and Agent grid without reloading or moving the iframe. Both views share the
same run, restricted policy observations, input owner and saved action history.
The human may see more than the policy; record the display choice on human actions.

Keep an input surface above the game so native handlers cannot bypass recording.
Route movement keys, inventory shortcuts, quickbar/inventory clicks, slot drags,
item-on-item use, drops and visible choice menus through Session.human. Inventory
open/close is local presentation state and does not create a training action. Retain
explicit targeting controls below the game. Pause, takeover, single-step, save
failures and agent help requests keep their existing ownership rules.

## Follow-up

Diagonal world clicks and richer native context menus remain follow-up work. Local
presentation actions such as zoom remain separate from game mutations. Test each interaction
against recorded before/after observations and zero-turn action costs.

An optional perception overlay can follow: remembered contacts, identification
limits and threats. It must not replace ordinary game artwork or reveal extra
information to policy inference. Training remains a separate step after recording.

## Acceptance checks

View switches preserve the same iframe and action count. Human movement is recorded
once, inactive input does nothing, two runs remain isolated, and switching runs
revokes human ownership. Normal timing resumes on takeover. Verify narrow layout,
exports, menu actions and ordinary play separately.
