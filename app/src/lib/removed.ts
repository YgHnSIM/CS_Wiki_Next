import removedCatalog from "../../../contracts/removed-documents.json";

export interface RemovedDocument {
  id: string;
  key: string;
  title: string;
  kind: string;
  mode: "archive" | "purge";
  removed_at: string;
  source_path?: string;
  replaced_by?: string | null;
  reason?: string;
  break_url: boolean;
}

export const removedDocuments = removedCatalog.removed as RemovedDocument[];
