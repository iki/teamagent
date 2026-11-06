---
name: rebase-integration
description: Integrate completed task branches as a linear sequence of commits, with optional pull-request review. Use for preparing, verifying, publishing, or recovering integration; not for changing repository permissions or deploying releases.
---

# Verified rebase integration

Read the target project's workflow policy for its exact destination, authorized publication actions, signing requirement, integration command, verification contract, and direct or pull-request mode. Use the maintained command rather than reimplementing its state machine in ad hoc shell commands. A skill or successful check does not grant publication authority.

The task owns its branch and commits; the integrator owns the short serialized landing boundary. Record the original task baseline and source commit sequence. Create or replay the candidate onto the freshly observed main head, preserving individual commits without a squash or merge commit. Keep the source-to-result commit mapping. Rewriting a private candidate is distinct from rewriting a published branch; never infer permission for a force push.

Stop on conflicts and retain the candidate state for resolution in the task's scope. Do not silently select one side, discard empty commits, or absorb changes outside the task. Re-sign replayed commits when required: changing a parent changes the signed object. Verify the resulting signatures and linear ancestry, not merely the signing configuration or a prior source signature.

Verify the actual integrated candidate after replay. Reuse only results admitted by the repository's complete input/prerequisite/output contract. A clean rebase or identical patch does not prove unchanged verification inputs. Recheck the staged or committed tree, frozen task record, scope, destination, and live gates at publication. Preserve test coverage, deadlines, and force-fresh operation.

Publish only a fast-forward of the expected destination. If main advances, release/retry through the project's explicit reconciliation path: observe the new base, rebuild the candidate, and verify it again. Do not turn rejection into a force push. Retain attempt state before external effects; if transport fails, inspect the actual remote result before retrying. Report local completion, remote confirmation, and uncertain outcomes separately.

## Pull-request mode

The PR adds a review boundary to the same task and candidate. Bind approval and required checks to the exact repository, base, and head; a changed candidate can require new review. Use configured branch protection and required checks without bypassing them. A mode switch does not authorize changing those settings.

GitHub's native **Rebase and merge** rewrites commit objects and cannot preserve the original signatures. If signed final commits are required, use the project's permitted local signed integration after PR review and ordinary fast-forward push; this route must itself satisfy repository policy. Where direct base pushes are forbidden, report the incompatibility and obtain the project owner's policy decision instead of silently producing unsigned commits or bypassing protection. See [GitHub's signature limitation](https://docs.github.com/en/authentication/managing-commit-signature-verification/about-commit-signature-verification#signature-verification-for-rebase-and-merge).

Do not force-update a published PR branch without explicit authorization. A new candidate branch/PR can preserve the prior review evidence when policy permits; the previous approval is not automatically approval of replacement content.
