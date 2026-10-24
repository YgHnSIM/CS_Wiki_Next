import traceCatalog from "../../../catalog/traces.json";

export interface TraceCheckpoint {
  question: string;
  answer: string;
  evidence: string[];
}

export interface TraceStep {
  document: string;
  role: "source" | "concept" | "analysis" | "entity";
  why: string;
  checkpoint: TraceCheckpoint;
}

export interface TraceBranch {
  id: string;
  label: string;
  documents: string[];
}

export interface Trace {
  id: string;
  title: string;
  question: string;
  outcome: string;
  audience: string;
  minutes: number;
  prerequisites: string[];
  steps: TraceStep[];
  branches: TraceBranch[];
}

export const traces = traceCatalog.traces as Trace[];
export const traceById = new Map(traces.map((trace) => [trace.id, trace]));

export function tracesForDocument(key: string): Trace[] {
  return traces.filter((trace) =>
    trace.steps.some((step) => step.document === key)
    || trace.prerequisites.includes(key)
    || trace.branches.some((branch) => branch.documents.includes(key))
  );
}
