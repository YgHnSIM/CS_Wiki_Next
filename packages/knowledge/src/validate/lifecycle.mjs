import path from "node:path";
import { toPosixRelative } from "../shared/fs.mjs";

export function validateLifecycle(root, workspace) {
  const issues = [];
  const { pageById } = workspace;
  const add = (code, page, message) => {
    const relative = page.filePath ? toPosixRelative(root, page.filePath) : page.id;
    issues.push({ code, path: relative, pageId: page.id, message });
  };

  for (const page of workspace.pages) {
    const { status, superseded_by: supersededBy, retirement, publication_visibility: visibility } = page.data;

    if (status === "stale") {
      if (!supersededBy) {
        add("supersede.missing", page, "stale page needs superseded_by");
      }
    }

    if (supersededBy) {
      if (supersededBy === page.id) {
        add("supersede.self", page, `self superseded_by ${supersededBy}`);
      } else {
        const target = pageById.get(supersededBy);
        if (!target) {
          add("supersede.target", page, `missing superseded_by ${supersededBy}`);
        } else {
          if (target.data.publication_visibility !== "public" || target.data.retirement) {
            add("supersede.target_state", page, `superseded_by target ${supersededBy} must be an active public page`);
          }
          // Detect supersession cycle
          const visited = new Set([page.id]);
          let cursor = target;
          while (cursor?.data?.superseded_by) {
            if (visited.has(cursor.data.superseded_by)) {
              add("supersede.cycle", page, `superseded_by cycle detected involving ${page.id}`);
              break;
            }
            visited.add(cursor.data.superseded_by);
            cursor = pageById.get(cursor.data.superseded_by);
          }
        }
      }
    }

    if (retirement) {
      if (visibility !== "unlisted") {
        add("retirement.visibility", page, "retired page must have publication_visibility: unlisted");
      }
      if (retirement.mode === "redirect") {
        const redirectTargetId = retirement.superseded_by;
        if (!redirectTargetId) {
          add("retirement.target", page, "redirect retirement needs retirement.superseded_by");
        } else if (redirectTargetId === page.id) {
          add("retirement.self", page, "redirect retirement target must differ from retired page");
        } else {
          const target = pageById.get(redirectTargetId);
          if (!target) {
            add("retirement.target", page, `missing redirect target ${redirectTargetId}`);
          } else if (target.data.publication_visibility !== "public" || target.data.retirement) {
            add("retirement.chain", page, `redirect target ${redirectTargetId} must be a public, non-retired page`);
          }
        }
      }
    }
  }

  return issues;
}
