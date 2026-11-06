---
name: verification-evidence
description: Design, use, or audit reusable build and verification evidence without weakening required checks. Use when implementing, using, or auditing verification reuse across tasks, commits, hooks, or integration candidates, or when diagnosing stale cache hits.
---

# Reusable verification evidence

Read the project's verification contract, commands, cache schema, output policy, and required platform acceptance checks. Distinguish implemented reuse from a planned optimization. Use its validator and force-fresh command; do not infer a hit from a receipt filename, commit message, or another agent's report.

A reusable result binds the complete inputs to the claimed operation: source bytes and relevant untracked inputs, check definitions and options, lock/config files, actual provisioned tool/dependency bytes, runtime and platform identity, relevant environment, prerequisite results, and required output integrity. Record omissions as limitations; never silently omit an expensive input. Validate schema/version, bounded size, paths, hashes, and coverage before trusting data.

Bind evidence to the tree being delivered. Working-tree success does not verify a different staged index or a rebased candidate. Use the real active index, including an explicitly selected alternate index, where the contract requires it. Re-read live inputs at the acceptance boundary to detect concurrent changes. New prerequisites, configuration, installed bytes, or base content invalidate affected results even if the task's patch is unchanged.

Keep publication authorization, required live checks, external state, and signing/destination checks outside the cache. Git-stored receipts are cooperative evidence of a claimed successful check, not independent attestation. Preserve the project's CI policy; local reuse does not automatically permit CI reuse.

Separate source-writing steps from read-only review. Route ordinary final checks to an allowed local receipt store when tracked receipt writes would change the candidate under review. Receipt storage location must not alter coverage or eligibility. Never stage a newly changed receipt as a substitute for verifying the resulting complete tree.

Only successful, completely terminated work can publish reusable success. Failures invalidate matching success and retain bounded diagnostic/rejection evidence. Missing or corrupt outputs invalidate build hits. Partial test batches are not complete-suite success; narrower reuse requires an explicit dependency graph with complete coverage and separately validated receipts.

Preserve every required test, its deadline, the shared phase budget, and resource admission. Optimize repeated hashing, command dispatch, and independent work only when equivalence remains checked. Measure cold and warm runs separately using actual runtime versions. A faster cache lookup is not evidence of faster tests or independently verified task correctness.
