import { describe, expect, test } from "bun:test";
import { Effect, Schema } from "effect";
import { AgentDescriptorSchema } from "@/agents";
import { ArtifactSchema } from "@/artifacts";
import { CreateTaskInputSchema, TaskStatusSchema, canTransition, validateTaskInput } from "@/tasks";
import { CreateWorkspaceInputSchema } from "@/workspaces";

describe("portable task contracts", () => {
  test("task input is bounded and never assumes authorization", async () => {
    const valid = {
      workspaceId: "workspace",
      objective: "Inspect this workspace",
      adapterId: "inspect",
    };
    expect(await Effect.runPromise(validateTaskInput(valid))).toEqual(valid);
    const invalid = [
      { ...valid, objective: "   " },
      { ...valid, objective: "x".repeat(16_001) },
      { ...valid, adapterId: "../../agent" },
      { ...valid, maxDurationMs: 999 },
      { ...valid, maxDurationMs: 900_001 },
      { ...valid, maxTurns: 0 },
      { ...valid, maxTurns: 33 },
      { ...valid, allowWrites: "true" },
      { ...valid, idempotencyKey: "secret with spaces" },
    ];
    for (const value of invalid) expect(Schema.is(CreateTaskInputSchema)(value)).toBe(false);
  });

  test("terminal tasks cannot restart, complete twice, or return to the queue", () => {
    const statuses = TaskStatusSchema.literals;
    for (const status of statuses) {
      expect(canTransition(status, status)).toBe(false);
      expect(canTransition(status, "queued")).toBe(false);
    }
    for (const terminal of ["succeeded", "failed", "cancelled", "interrupted"] as const) {
      for (const target of statuses) expect(canTransition(terminal, target)).toBe(false);
    }
    expect(canTransition("queued", "running")).toBe(true);
    expect(canTransition("queued", "cancelled")).toBe(true);
    expect(canTransition("queued", "succeeded")).toBe(false);
    expect(canTransition("running", "succeeded")).toBe(true);
  });

  test("workspace, artifact and capability schemas reject unsafe representations", () => {
    expect(Schema.is(CreateWorkspaceInputSchema)({ name: "Workspace", path: "a\u0000b" })).toBe(
      false,
    );
    const artifact = {
      id: "id",
      taskId: "task",
      name: "answer.md",
      mediaType: "text/markdown",
      size: 1,
      sha256: "a".repeat(64),
      createdAt: "2026-10-04T12:00:00.000Z",
    };
    expect(Schema.is(ArtifactSchema)(artifact)).toBe(true);
    expect(Schema.is(ArtifactSchema)({ ...artifact, name: "../answer.md" })).toBe(false);
    expect(Schema.is(ArtifactSchema)({ ...artifact, sha256: "../x" })).toBe(false);
    expect(Schema.is(ArtifactSchema)({ ...artifact, size: 4_194_305 })).toBe(false);
    expect(
      Schema.is(AgentDescriptorSchema)({
        id: "pi",
        name: "Pi",
        description: "Agent",
        available: true,
        capabilities: { sandboxed: true },
        evidence: "none",
      }),
    ).toBe(false);
  });
});
