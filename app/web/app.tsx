import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import type { AgentDescriptor } from "@/agents";
import type { Artifact } from "@/artifacts";
import type { Task, TaskEvent } from "@/tasks";
import type { Workspace } from "@/workspaces";
import { api, desktopConnection, errorMessage, type Connection } from "./api.ts";

const taskLabels: Readonly<Record<Task["status"], string>> = {
  queued: "Queued",
  running: "Running",
  succeeded: "Completed",
  failed: "Failed",
  cancelled: "Cancelled",
  interrupted: "Interrupted",
};
const active = (task: Task) => task.status === "running" || task.status === "queued";
const time = (value: string) =>
  new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit" }).format(
    new Date(value),
  );

function Notice({ children }: { readonly children: ReactNode }) {
  return (
    <div className="notice" role="alert">
      {children}
    </div>
  );
}

function Status({ task }: { readonly task: Task }) {
  return (
    <span className={`status status-${task.status}`}>
      <span aria-hidden="true" />
      {taskLabels[task.status]}
    </span>
  );
}

function Brand() {
  return (
    <div className="brand">
      <svg viewBox="0 0 28 28" aria-hidden="true">
        <path d="M4 5h20v5H4zM4 13h12v5H4zM4 21h20v3H4z" fill="currentColor" />
      </svg>
      <span>Team Agent</span>
    </div>
  );
}

function Connect({
  onConnect,
  initialError,
  mode,
}: {
  readonly onConnect: (connection: Connection) => Promise<void>;
  readonly initialError: string;
  readonly mode: "browser" | "desktop";
}) {
  const [token, setToken] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      const native = mode === "desktop" ? await desktopConnection() : null;
      if (mode === "desktop" && !native) throw new Error("Desktop connection unavailable");
      await onConnect(native ?? { url: "", token: token.trim() });
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setPending(false);
    }
  }
  return (
    <main className="connect-page">
      <Brand />
      <section className="connect-panel">
        <div className="connection-symbol" aria-hidden="true">
          ↔
        </div>
        <h1>Your work, under control.</h1>
        <p>
          Connect to your local service to start tasks, follow their progress, and keep the results
          together.
        </p>
        <form
          onSubmit={(event) => {
            void submit(event);
          }}
        >
          {mode === "browser" ? (
            <>
              <label htmlFor="token">Access token</label>
              <input
                id="token"
                name="token"
                type="password"
                autoComplete="current-password"
                required
                minLength={32}
                value={token}
                onChange={(event) => setToken(event.target.value)}
                aria-describedby="token-help"
              />
              <p id="token-help" className="help">
                Use the token configured for your local service. It stays in memory and is cleared
                when you disconnect.
              </p>
            </>
          ) : (
            <p className="help">
              Reconnect through the desktop service. Your task history is still available.
            </p>
          )}
          {error || initialError ? <Notice>{error || initialError}</Notice> : null}
          <button className="button primary" disabled={pending} type="submit">
            {pending
              ? "Connecting…"
              : mode === "desktop"
                ? "Reconnect local service"
                : "Connect to workspace"}
          </button>
        </form>
      </section>
      <p className="connect-footer">Local execution. Durable records. Your choice of agent.</p>
    </main>
  );
}

interface Snapshot {
  readonly workspaces: readonly Workspace[];
  readonly tasks: readonly Task[];
  readonly agents: readonly AgentDescriptor[];
}

async function snapshot(connection: Connection, signal: AbortSignal): Promise<Snapshot> {
  const [workspaces, tasks, agents] = await Promise.all([
    api.workspaces(connection, signal),
    api.tasks(connection, signal),
    api.agents(connection, signal),
  ]);
  return { workspaces, tasks, agents };
}

export function App() {
  const [connection, setConnection] = useState<Connection | null>(null);
  const [mode, setMode] = useState<"browser" | "desktop">("browser");
  const [data, setData] = useState<Snapshot>({ workspaces: [], tasks: [], agents: [] });
  const [error, setError] = useState("");
  const [workspaceId, setWorkspaceId] = useState("");
  const [taskId, setTaskId] = useState("");
  const [view, setView] = useState<"tasks" | "agents">("tasks");
  const [form, setForm] = useState<"none" | "task" | "workspace">("none");
  const [revision, setRevision] = useState(0);
  const connectGeneration = useRef(0);
  async function connect(next: Connection) {
    const generation = ++connectGeneration.current;
    const result = await snapshot(next, AbortSignal.timeout(15000));
    if (generation !== connectGeneration.current) return;
    setData(result);
    setConnection(next);
    setError("");
  }
  useEffect(() => {
    let disposed = false;
    desktopConnection()
      .then(async (value) => {
        if (!disposed && value) {
          setMode("desktop");
          await connect(value);
        }
      })
      .catch((cause: unknown) => {
        if (!disposed) setError(errorMessage(cause));
      });
    return () => {
      disposed = true;
      connectGeneration.current++;
    };
  }, []);
  useEffect(() => {
    if (!connection) return;
    const currentConnection = connection;
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    async function refresh() {
      try {
        const result = await snapshot(
          currentConnection,
          AbortSignal.any([controller.signal, AbortSignal.timeout(15000)]),
        );
        if (!controller.signal.aborted) {
          setData(result);
          setError("");
        }
      } catch (cause) {
        if (!controller.signal.aborted) setError(errorMessage(cause));
      }
      if (!controller.signal.aborted)
        timer = setTimeout(() => {
          void refresh();
        }, 2500);
    }
    void refresh();
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [connection, revision]);
  if (!connection) return <Connect onConnect={connect} initialError={error} mode={mode} />;
  const tasks = data.tasks.filter((task) => !workspaceId || task.workspaceId === workspaceId);
  const selectedTask = data.tasks.find((task) => task.id === taskId);
  const selectedWorkspace = data.workspaces.find((workspace) => workspace.id === workspaceId);
  const running = data.tasks.filter(active).length;
  function refresh() {
    setRevision((value) => value + 1);
  }
  function disconnect() {
    connectGeneration.current++;
    setConnection(null);
    setData({ workspaces: [], tasks: [], agents: [] });
    setTaskId("");
    setWorkspaceId("");
    setForm("none");
    setError("");
  }
  return (
    <div className="shell">
      <a className="skip-link" href="#main">
        Skip to tasks
      </a>
      <aside className="sidebar">
        <Brand />
        <div className="local-indicator">
          <span aria-hidden="true" />
          Local workspace
        </div>
        <nav aria-label="Main navigation">
          <button
            className={`nav-item ${view === "tasks" ? "selected" : ""}`}
            onClick={() => setView("tasks")}
            aria-current={view === "tasks" ? "page" : undefined}
          >
            <span aria-hidden="true">▤</span>Tasks<span className="count">{data.tasks.length}</span>
          </button>
          <button
            className={`nav-item ${view === "agents" ? "selected" : ""}`}
            onClick={() => setView("agents")}
            aria-current={view === "agents" ? "page" : undefined}
          >
            <span aria-hidden="true">◇</span>Agents
            <span className="count">{data.agents.filter((agent) => agent.available).length}</span>
          </button>
        </nav>
        <div className="workspace-heading">
          <h2>Workspaces</h2>
          <button
            className="icon-button"
            aria-label="Add workspace"
            onClick={() => setForm("workspace")}
          >
            +
          </button>
        </div>
        <nav className="workspace-nav" aria-label="Workspaces">
          <button
            className={!workspaceId ? "selected" : ""}
            onClick={() => {
              setWorkspaceId("");
              setView("tasks");
            }}
          >
            All workspaces
          </button>
          {data.workspaces.map((workspace) => (
            <button
              key={workspace.id}
              className={workspaceId === workspace.id ? "selected" : ""}
              onClick={() => {
                setWorkspaceId(workspace.id);
                setView("tasks");
              }}
              title={workspace.path}
            >
              <span className="folder-mark" aria-hidden="true" />
              {workspace.name}
            </button>
          ))}
        </nav>
        <div className="sidebar-foot">
          <div>
            <span className={`service-dot ${error ? "offline" : ""}`} aria-hidden="true" />
            <span>{error ? "Connection needs attention" : "Service connected"}</span>
          </div>
          <button className="text-button" onClick={disconnect}>
            Disconnect
          </button>
        </div>
      </aside>
      <main id="main" className="main">
        <header className="page-header">
          <div>
            <p className="breadcrumb">Workspace / {view === "tasks" ? "Tasks" : "Agents"}</p>
            <h1>{view === "agents" ? "Your agents" : (selectedWorkspace?.name ?? "All tasks")}</h1>
            <p>
              {view === "agents"
                ? "See what is available and which guarantees each adapter supports."
                : "Give work a clear objective. Keep every result in view."}
            </p>
          </div>
          {view === "tasks" ? (
            <button
              className="button primary"
              onClick={() => setForm(data.workspaces.length ? "task" : "workspace")}
            >
              + New task
            </button>
          ) : null}
        </header>
        {error ? (
          <Notice>
            {error}{" "}
            <button className="text-button" onClick={refresh}>
              Try again
            </button>
          </Notice>
        ) : null}
        {view === "agents" ? (
          <AgentList agents={data.agents} />
        ) : (
          <>
            <div className="queue-heading">
              <h2>Task queue</h2>
              <span>{running === 0 ? "Nothing running" : `${running} active`}</span>
            </div>
            <div className={`task-layout ${selectedTask ? "with-detail" : ""}`}>
              <section className="task-list" aria-label="Task queue">
                {tasks.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-symbol" aria-hidden="true">
                      ▤
                    </div>
                    <h3>A clear place to start.</h3>
                    <p>
                      {data.workspaces.length
                        ? "Create a task with an objective and choose an agent. Its progress and results will appear here."
                        : "Add a local folder as a workspace, then create your first task."}
                    </p>
                    <button
                      className="button secondary"
                      onClick={() => setForm(data.workspaces.length ? "task" : "workspace")}
                    >
                      {data.workspaces.length ? "Create a task" : "Add a workspace"}
                    </button>
                  </div>
                ) : (
                  tasks.map((task) => (
                    <button
                      className={`task-row ${task.id === taskId ? "selected" : ""}`}
                      key={task.id}
                      onClick={() => setTaskId(task.id)}
                      aria-pressed={task.id === taskId}
                    >
                      <div className="task-row-top">
                        <Status task={task} />
                        <time dateTime={task.createdAt}>{time(task.createdAt)}</time>
                      </div>
                      <h3>{task.objective}</h3>
                      <div className="task-row-foot">
                        <span>
                          {data.workspaces.find((workspace) => workspace.id === task.workspaceId)
                            ?.name ?? "Workspace"}
                        </span>
                        <span>
                          {data.agents.find((agent) => agent.id === task.adapterId)?.name ??
                            task.adapterId}
                        </span>
                      </div>
                    </button>
                  ))
                )}
              </section>
              {selectedTask ? (
                <TaskDetail
                  key={selectedTask.id}
                  connection={connection}
                  task={selectedTask}
                  onClose={() => setTaskId("")}
                  onChange={refresh}
                />
              ) : null}
            </div>
            <p className="queue-note">
              Task history stays with the local service when you close this window.
            </p>
          </>
        )}
      </main>
      {form === "workspace" ? (
        <WorkspaceForm
          connection={connection}
          onClose={() => setForm("none")}
          onCreated={(workspace) => {
            setData((current) => ({ ...current, workspaces: [...current.workspaces, workspace] }));
            setWorkspaceId(workspace.id);
            setForm("none");
            refresh();
          }}
        />
      ) : form === "task" ? (
        <TaskForm
          connection={connection}
          workspaces={data.workspaces}
          agents={data.agents}
          workspaceId={workspaceId}
          onClose={() => setForm("none")}
          onCreated={(task) => {
            setData((current) => ({ ...current, tasks: [task, ...current.tasks] }));
            setTaskId(task.id);
            setWorkspaceId(task.workspaceId);
            setView("tasks");
            setForm("none");
            refresh();
          }}
        />
      ) : null}
    </div>
  );
}

function Dialog({
  title,
  children,
  onClose,
}: {
  readonly title: string;
  readonly children: ReactNode;
  readonly onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => {
      element?.close();
    };
  }, []);
  return (
    <dialog ref={dialog} className="dialog" onCancel={onClose} aria-labelledby="dialog-title">
      <div className="dialog-header">
        <h2 id="dialog-title">{title}</h2>
        <button className="icon-button" onClick={onClose} aria-label="Close dialog">
          ×
        </button>
      </div>
      {children}
    </dialog>
  );
}

function WorkspaceForm({
  connection,
  onClose,
  onCreated,
}: {
  readonly connection: Connection;
  readonly onClose: () => void;
  readonly onCreated: (workspace: Workspace) => void;
}) {
  const [name, setName] = useState("");
  const [path, setPath] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      onCreated(
        await api.createWorkspace(
          connection,
          { name: name.trim(), path: path.trim() },
          AbortSignal.timeout(15000),
        ),
      );
    } catch (cause) {
      setError(errorMessage(cause));
      setPending(false);
    }
  }
  return (
    <Dialog title="Add a workspace" onClose={onClose}>
      <form
        onSubmit={(event) => {
          void submit(event);
        }}
      >
        <p>
          A workspace is an existing local folder. The service checks the path before it accepts
          tasks.
        </p>
        <label htmlFor="workspace-name">Name</label>
        <input
          id="workspace-name"
          name="name"
          autoComplete="off"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
          maxLength={100}
        />
        <label htmlFor="workspace-path">Absolute folder path</label>
        <input
          id="workspace-path"
          name="path"
          autoComplete="off"
          spellCheck={false}
          value={path}
          onChange={(event) => setPath(event.target.value)}
          required
          maxLength={4096}
          placeholder="C:\Projects\my-project"
        />
        {error ? <Notice>{error}</Notice> : null}
        <div className="form-actions">
          <button type="button" className="button secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="button primary" disabled={pending}>
            {pending ? "Adding…" : "Add workspace"}
          </button>
        </div>
      </form>
    </Dialog>
  );
}

function TaskForm({
  connection,
  workspaces,
  agents,
  workspaceId,
  onClose,
  onCreated,
}: {
  readonly connection: Connection;
  readonly workspaces: readonly Workspace[];
  readonly agents: readonly AgentDescriptor[];
  readonly workspaceId: string;
  readonly onClose: () => void;
  readonly onCreated: (task: Task) => void;
}) {
  const [workspace, setWorkspace] = useState(workspaceId || workspaces[0]?.id || "");
  const [agent, setAgent] = useState(agents.find((candidate) => candidate.available)?.id ?? "");
  const [objective, setObjective] = useState("");
  const [duration, setDuration] = useState("120");
  const [allowWrites, setAllowWrites] = useState(false);
  const [maxTurns, setMaxTurns] = useState("8");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const requestId = useRef(crypto.randomUUID());
  const selectedAgent = agents.find((candidate) => candidate.id === agent);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      onCreated(
        await api.createTask(
          connection,
          {
            workspaceId: workspace,
            adapterId: agent,
            objective: objective.trim(),
            maxDurationMs: Number(duration) * 1000,
            allowWrites,
            maxTurns: Number(maxTurns),
            idempotencyKey: requestId.current,
          },
          AbortSignal.timeout(15000),
        ),
      );
    } catch (cause) {
      setError(errorMessage(cause));
      setPending(false);
    }
  }
  return (
    <Dialog title="New task" onClose={onClose}>
      <form
        onSubmit={(event) => {
          void submit(event);
        }}
      >
        <label htmlFor="objective">What should the agent do?</label>
        <textarea
          id="objective"
          name="objective"
          value={objective}
          onChange={(event) => setObjective(event.target.value)}
          required
          maxLength={16000}
          rows={5}
          placeholder="Describe the outcome you want and how to verify it…"
        />
        <div className="form-columns">
          <div>
            <label htmlFor="task-workspace">Workspace</label>
            <select
              id="task-workspace"
              name="workspace"
              value={workspace}
              onChange={(event) => setWorkspace(event.target.value)}
              required
            >
              {workspaces.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="task-agent">Agent</label>
            <select
              id="task-agent"
              name="agent"
              value={agent}
              onChange={(event) => setAgent(event.target.value)}
              required
            >
              {agents.map((item) => (
                <option key={item.id} value={item.id} disabled={!item.available}>
                  {item.name}
                  {item.available ? "" : " (unavailable)"}
                </option>
              ))}
            </select>
          </div>
        </div>
        {selectedAgent ? (
          <p className="help">{selectedAgent.description}</p>
        ) : (
          <Notice>No agent is available. Check the Agents page for setup details.</Notice>
        )}
        <div className="form-columns">
          <div>
            <label htmlFor="task-duration">Time limit in seconds</label>
            <input
              id="task-duration"
              name="duration"
              type="number"
              min={1}
              max={900}
              step={1}
              required
              value={duration}
              onChange={(event) => setDuration(event.target.value)}
            />
          </div>
          <div>
            <label htmlFor="task-turns">Maximum agent turns</label>
            <input
              id="task-turns"
              name="turns"
              type="number"
              min={1}
              max={32}
              step={1}
              required
              value={maxTurns}
              onChange={(event) => setMaxTurns(event.target.value)}
            />
          </div>
        </div>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={allowWrites}
            onChange={(event) => setAllowWrites(event.target.checked)}
          />
          Allow changes inside this workspace
        </label>
        <p className="help">
          Read-only by default. The agent cannot grant itself permission to write files.
        </p>
        {error ? <Notice>{error}</Notice> : null}
        <div className="form-actions">
          <button type="button" className="button secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="button primary" disabled={pending || !agent}>
            {pending ? "Creating…" : "Start task"}
          </button>
        </div>
      </form>
    </Dialog>
  );
}

function TaskDetail({
  connection,
  task,
  onClose,
  onChange,
}: {
  readonly connection: Connection;
  readonly task: Task;
  readonly onClose: () => void;
  readonly onChange: () => void;
}) {
  const [events, setEvents] = useState<readonly TaskEvent[]>([]);
  const [artifacts, setArtifacts] = useState<readonly Artifact[]>([]);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [preview, setPreview] = useState<{
    readonly name: string;
    readonly content: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const sequence = useRef(0);
  useEffect(() => {
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    async function refresh() {
      try {
        const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(15000)]);
        const [nextEvents, nextArtifacts] = await Promise.all([
          api.events(connection, task.id, sequence.current, signal),
          api.artifacts(connection, task.id, signal),
        ]);
        if (!controller.signal.aborted) {
          const additions = nextEvents.filter((event) => event.sequence > sequence.current);
          setEvents((current) => [...current, ...additions].slice(-500));
          sequence.current = Math.max(
            sequence.current,
            ...nextEvents.map((event) => event.sequence),
          );
          setArtifacts(nextArtifacts);
          setError("");
          setLoading(false);
        }
      } catch (cause) {
        if (!controller.signal.aborted) {
          setError(errorMessage(cause));
          setLoading(false);
        }
      }
      if (!controller.signal.aborted)
        timer = setTimeout(() => {
          void refresh();
        }, 2000);
    }
    void refresh();
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [connection, task.id]);
  async function cancel() {
    setPending(true);
    setError("");
    try {
      await api.cancel(connection, task.id, AbortSignal.timeout(15000));
      onChange();
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setPending(false);
    }
  }
  async function openArtifact(artifact: Artifact) {
    setPending(true);
    setError("");
    try {
      setPreview({
        name: artifact.name,
        content: await api.content(
          connection,
          artifact.id,
          artifact.sha256,
          AbortSignal.timeout(15000),
        ),
      });
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setPending(false);
    }
  }
  return (
    <section className="task-detail" aria-label="Task details">
      <header className="detail-header">
        <Status task={task} />
        <button className="icon-button" aria-label="Close task details" onClick={onClose}>
          ×
        </button>
      </header>
      <h2>{task.objective}</h2>
      <p className="task-id">{task.id}</p>
      <dl className="task-facts">
        <div>
          <dt>Time limit</dt>
          <dd>{task.maxDurationMs / 1000}s</dd>
        </div>
        <div>
          <dt>Last updated</dt>
          <dd>
            <time dateTime={task.updatedAt}>{time(task.updatedAt)}</time>
          </dd>
        </div>
      </dl>
      {active(task) ? (
        <button
          className="button secondary cancel-button"
          disabled={pending}
          onClick={() => {
            void cancel();
          }}
        >
          {pending ? "Working…" : "Cancel task"}
        </button>
      ) : null}
      {task.status === "interrupted" ? (
        <p className="help">
          Execution was interrupted. Review the record before starting another task; earlier effects
          may already have happened.
        </p>
      ) : null}
      {error ? <Notice>{error}</Notice> : null}
      <div className="record-heading">
        <h3>Activity</h3>
        <span>{events.length} events</span>
      </div>
      <div className="event-list" aria-busy={loading}>
        {loading ? (
          <p className="help" role="status">
            Loading activity…
          </p>
        ) : events.length === 0 ? (
          <p className="help">The task is accepted. Its execution record will appear here.</p>
        ) : (
          <ol>
            {events.map((event) => (
              <li key={event.id}>
                <div>
                  <span>{event.type.replaceAll(".", " ")}</span>
                  <time dateTime={event.createdAt}>{time(event.createdAt)}</time>
                </div>
                <p>{event.message}</p>
              </li>
            ))}
          </ol>
        )}
      </div>
      {events.length === 500 ? (
        <p className="help">
          Showing the latest 500 loaded events. Use the CLI to export the complete history.
        </p>
      ) : null}
      <div className="record-heading">
        <h3>Artifacts</h3>
        <span>{artifacts.length}</span>
      </div>
      {artifacts.length === 0 ? (
        <p className="help">Verified outputs will appear here.</p>
      ) : (
        <ul className="artifact-list">
          {artifacts.map((artifact) => (
            <li key={artifact.id}>
              <button
                className="artifact-button"
                disabled={pending}
                onClick={() => {
                  void openArtifact(artifact);
                }}
              >
                <span>{artifact.name}</span>
                <span>{new Intl.NumberFormat().format(artifact.size)} bytes</span>
              </button>
              <p className="artifact-hash" title={artifact.sha256}>
                SHA-256 {artifact.sha256}
              </p>
            </li>
          ))}
        </ul>
      )}
      {preview ? (
        <Dialog title={preview.name} onClose={() => setPreview(null)}>
          <pre className="artifact-preview">{preview.content}</pre>
        </Dialog>
      ) : null}
    </section>
  );
}

const capabilityNames: Readonly<Record<keyof AgentDescriptor["capabilities"], string>> = {
  effectInterception: "Tool control",
  approvalInterception: "Approval control",
  filesystemIsolation: "File isolation",
  networkIsolation: "Network isolation",
  cancellationEnforcement: "Cancellation",
};

function AgentList({ agents }: { readonly agents: readonly AgentDescriptor[] }) {
  return (
    <section className="agent-list" aria-label="Agent capabilities">
      {agents.length === 0 ? (
        <div className="empty-state">
          <h2>No adapters found</h2>
          <p>Configure an adapter in the local service, then reconnect.</p>
        </div>
      ) : (
        agents.map((agent) => (
          <article className="agent-card" key={agent.id}>
            <header>
              <div className="agent-mark" aria-hidden="true">
                ◇
              </div>
              <div>
                <h2>{agent.name}</h2>
                <span className={agent.available ? "available" : "unavailable"}>
                  {agent.available ? "Available" : "Needs setup"}
                </span>
              </div>
            </header>
            <p>{agent.description}</p>
            <dl className="capabilities">
              {Object.entries(capabilityNames).map(([key, label]) => (
                <div key={key}>
                  <dt>{label}</dt>
                  <dd>
                    {Object.entries(agent.capabilities).find(([name]) => name === key)?.[1] ??
                      "unknown"}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="help">{agent.evidence}</p>
          </article>
        ))
      )}
    </section>
  );
}
