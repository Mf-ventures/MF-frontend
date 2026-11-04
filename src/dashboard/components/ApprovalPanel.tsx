import { useState } from "react";
import { Button } from "@/components/ui";
import type { ApprovalDecision, ApprovalStage } from "@/dashboard/types";
import { APPROVAL_DECISION_LABEL } from "@/dashboard/data/labels";

interface ApprovalPanelProps {
  stage: ApprovalStage;
  onDecide: (decision: ApprovalDecision, comment: string) => Promise<void>;
}


export function ApprovalPanel({ stage, onDecide }: ApprovalPanelProps) {
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<ApprovalDecision | null>(null);
  const [recorded, setRecorded] = useState<ApprovalDecision | null>(null);

  async function handleDecide(decision: ApprovalDecision) {
    if (decision === "reject_return" && comment.trim().length === 0) {
      setError("Add a comment so the mechanic knows what to fix.");
      return;
    }
    setError(null);
    setSubmitting(decision);
    try {
      await onDecide(decision, comment.trim());
      setRecorded(decision);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setSubmitting(null);
    }
  }

  if (recorded) {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-5 text-sm font-medium text-emerald-800">
        Decision recorded: {APPROVAL_DECISION_LABEL[recorded]}.
      </div>
    );
  }

  const stageLabel = stage === "supervisor" ? "Supervisor" : "MD";

  return (
    <div className="rounded-lg border border-brand-blue/20 bg-brand-blue/5 p-5">
      <h2 className="text-sm font-semibold text-ink">
        {stageLabel} Decision Required
      </h2>
      <p className="mt-1 text-sm text-muted">
        Approve to move this request forward, or reject and return it with a
        comment explaining what needs to change.
      </p>

      <label className="mt-4 block">
        <span className="mb-1.5 block text-xs font-medium tracking-wide text-muted uppercase">
          Comment
        </span>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          placeholder="Required for Reject / Return"
          className="w-full rounded-md border border-black/10 bg-white px-3 py-2 text-sm text-ink placeholder:text-muted/60 focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
        />
      </label>

      {error && (
        <p className="mt-2 text-sm font-medium text-red-600">{error}</p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          size="md"
          onClick={() => handleDecide("approve")}
          disabled={submitting !== null}
        >
          {submitting === "approve" ? "Approving…" : "Approve Repair"}
        </Button>
        <Button
          variant="danger"
          size="md"
          onClick={() => handleDecide("reject_return")}
          disabled={submitting !== null}
        >
          {submitting === "reject_return" ? "Recording…" : "Reject / Return"}
        </Button>
      </div>
    </div>
  );
}
