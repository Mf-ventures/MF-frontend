import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { Button, Modal } from "@/components/ui";
import {
  PageHeader,
  StatusBadge,
  PriorityBadge,
  EmptyState,
} from "@/dashboard/components";
import { getEquipment } from "@/dashboard/api/equipment";
import {
  useDashboardData,
  getErrorMessage,
  
} from "@/dashboard/state/DashboardProvider";
import { formatDate, formatNaira } from "@/dashboard/data/selectors";
import { EQUIPMENT_STATUS_LABEL } from "@/dashboard/data/labels";
import type { Equipment, EquipmentStatus } from "@/dashboard/types";

const STATUS_OPTIONS: EquipmentStatus[] = [
  "actively_working",
  "idle",
  "under_maintenance",
  "off_hire",
];

interface EditForm {
  name: string;
  equipmentType: string;
  serialNumber: string;
  modelNumber: string;
  capacitySpec: string;
  tonnage: string;
  currentLocation: string;
  assignedSite: string;
  status: EquipmentStatus;
  nextMaintenanceDate: string;
}

function toEditForm(eq: Equipment): EditForm {
  return {
    name: eq.name,
    equipmentType: eq.equipmentType ?? "",
    serialNumber: eq.serialNumber ?? "",
    modelNumber: eq.modelNumber ?? "",
    capacitySpec: eq.capacitySpec ?? "",
    tonnage: eq.tonnage != null ? String(eq.tonnage) : "",
    currentLocation: eq.currentLocation ?? "",
    assignedSite: eq.assignedSite ?? "",
    status: eq.status,
    nextMaintenanceDate: eq.nextMaintenanceDate ?? "",
  };
}

export default function EquipmentProfile() {
  const { equipmentId } = useParams<{ equipmentId: string }>();
  const { updateEquipmentRecord } = useDashboardData();
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSubmitting, setEditSubmitting] = useState(false);

  useEffect(() => {
    if (!equipmentId) return;
    let cancelled = false;
    setLoading(true);
    getEquipment(equipmentId)
      .then((eq) => {
        if (!cancelled) setEquipment(eq);
      })
      .catch((err) => {
        if (!cancelled) setError(getErrorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [equipmentId]);

  function openEditModal() {
    if (!equipment) return;
    setEditForm(toEditForm(equipment));
    setEditError(null);
    setIsEditOpen(true);
  }

  async function handleSaveEdit() {
    if (!equipment || !editForm) return;
    if (!editForm.name.trim()) {
      setEditError("Equipment name is required.");
      return;
    }
    const tonnageValue = editForm.tonnage.trim()
      ? Number(editForm.tonnage.trim())
      : undefined;
    if (tonnageValue !== undefined && Number.isNaN(tonnageValue)) {
      setEditError("Tonnage must be a number.");
      return;
    }
    setEditSubmitting(true);
    setEditError(null);
    const result = await updateEquipmentRecord(equipment.id, {
      name: editForm.name.trim(),
      equipmentType: editForm.equipmentType.trim() || undefined,
      serialNumber: editForm.serialNumber.trim() || undefined,
      modelNumber: editForm.modelNumber.trim() || undefined,
      capacitySpec: editForm.capacitySpec.trim() || undefined,
      tonnage: tonnageValue,
      currentLocation: editForm.currentLocation.trim() || undefined,
      assignedSite: editForm.assignedSite.trim() || undefined,
      status: editForm.status,
      nextMaintenanceDate: editForm.nextMaintenanceDate || undefined,
    });
    setEditSubmitting(false);

    if ("error" in result) {
      setEditError(result.error);
      return;
    }
    setEquipment((prev) =>
      prev ? { ...result, repairRequests: prev.repairRequests } : result,
    );
    setIsEditOpen(false);
  }

  if (loading) return <EmptyState message="Loading equipment profile…" />;
  if (error) return <EmptyState message={error} />;
  if (!equipment) {
    return <EmptyState message="Equipment record not found." />;
  }

  const repairRequests = equipment.repairRequests ?? [];

  const fields: Array<[string, string]> = [
    ["Registration Number", equipment.registrationNumber],
    ["Serial Number", equipment.serialNumber ?? "—"],
    ["Model Number", equipment.modelNumber ?? "—"],
    ["Capacity / Specification", equipment.capacitySpec ?? "—"],
    ["Tonnage", equipment.tonnage != null ? `${equipment.tonnage}t` : "—"],
    ["Current Location", equipment.currentLocation ?? "—"],
    ["Site", equipment.assignedSite ?? "—"],
    ["Last Maintenance Date", formatDate(equipment.lastMaintenanceDate)],
    ["Next Maintenance Date", formatDate(equipment.nextMaintenanceDate)],
  ];

  return (
    <div className="space-y-8">
      <Link
        to="/dashboard/equipment"
        className="inline-flex items-center gap-1 text-sm font-semibold text-brand-blue hover:underline"
      >
        ← Back to Equipment Register
      </Link>

      <PageHeader
        title={equipment.name}
        description={`Equipment profile${equipment.assignedSite ? ` · ${equipment.assignedSite}` : ""}`}
        actions={
          <div className="flex items-center gap-3">
            <StatusBadge status={equipment.status} />
            <Button size="md" onClick={openEditModal}>
              Edit
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-lg border border-black/5 bg-white p-5 shadow-sm lg:col-span-2">
          <h2 className="text-sm font-semibold text-ink">Equipment details</h2>
          <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            {fields.map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs font-medium tracking-wide text-muted uppercase">
                  {label}
                </dt>
                <dd className="mt-1 text-sm font-medium text-ink">{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="rounded-lg border border-black/5 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-ink">
            Total Maintenance Cost
          </h2>
          <p className="mt-3 text-2xl font-extrabold text-ink">
            {formatNaira(equipment.totalMaintenanceCost)}
          </p>
          <p className="mt-1 text-sm text-muted">
            {repairRequests.length} linked repair request(s)
          </p>
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-ink">
          Linked repair requests
        </h2>
        {repairRequests.length === 0 ? (
          <EmptyState message="No repair requests have been logged for this equipment yet." />
        ) : (
          <div className="space-y-3">
            {repairRequests.map((rr) => (
              <Link
                key={rr.id}
                to={`/dashboard/repair-requests/${rr.id}`}
                className="flex flex-col gap-2 rounded-lg border border-black/5 bg-white p-4 shadow-sm transition-colors hover:bg-surface/60 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-semibold text-ink">
                    {rr.requestNumber}
                  </p>
                  <p className="mt-0.5 text-sm text-muted">
                    {rr.faultDescription}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <PriorityBadge priority={rr.priority} />
                  <StatusBadge status={rr.status} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <Modal
        open={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Equipment"
        description={`Update details for ${equipment.name}.`}
      >
        {editForm && (
          <div className="space-y-4">
            <Field label="Equipment Name">
              <input
                type="text"
                value={editForm.name}
                onChange={(e) =>
                  setEditForm((f) => f && { ...f, name: e.target.value })
                }
                className={inputClass}
              />
            </Field>
            <Field label="Equipment Type">
              <input
                type="text"
                value={editForm.equipmentType}
                onChange={(e) =>
                  setEditForm(
                    (f) => f && { ...f, equipmentType: e.target.value },
                  )
                }
                className={inputClass}
              />
            </Field>
            <Field label="Serial Number">
              <input
                type="text"
                value={editForm.serialNumber}
                onChange={(e) =>
                  setEditForm(
                    (f) => f && { ...f, serialNumber: e.target.value },
                  )
                }
                className={inputClass}
              />
            </Field>
            <Field label="Model Number">
              <input
                type="text"
                value={editForm.modelNumber}
                onChange={(e) =>
                  setEditForm((f) => f && { ...f, modelNumber: e.target.value })
                }
                className={inputClass}
              />
            </Field>
            <Field label="Capacity / Specification">
              <input
                type="text"
                value={editForm.capacitySpec}
                onChange={(e) =>
                  setEditForm(
                    (f) => f && { ...f, capacitySpec: e.target.value },
                  )
                }
                className={inputClass}
              />
            </Field>
            <Field label="Tonnage">
              <input
                type="number"
                step="0.1"
                value={editForm.tonnage}
                onChange={(e) =>
                  setEditForm((f) => f && { ...f, tonnage: e.target.value })
                }
                className={inputClass}
              />
            </Field>
            <Field label="Current Location">
              <input
                type="text"
                value={editForm.currentLocation}
                onChange={(e) =>
                  setEditForm(
                    (f) => f && { ...f, currentLocation: e.target.value },
                  )
                }
                className={inputClass}
              />
            </Field>
            <Field label="Site">
              <input
                type="text"
                value={editForm.assignedSite}
                onChange={(e) =>
                  setEditForm(
                    (f) => f && { ...f, assignedSite: e.target.value },
                  )
                }
                className={inputClass}
              />
            </Field>
            <Field label="Status">
              <select
                value={editForm.status}
                onChange={(e) =>
                  setEditForm(
                    (f) =>
                      f && { ...f, status: e.target.value as EquipmentStatus },
                  )
                }
                className={inputClass}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {EQUIPMENT_STATUS_LABEL[s]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Next Maintenance Date">
              <input
                type="date"
                value={editForm.nextMaintenanceDate}
                onChange={(e) =>
                  setEditForm(
                    (f) => f && { ...f, nextMaintenanceDate: e.target.value },
                  )
                }
                className={inputClass}
              />
            </Field>

            {editError && (
              <p className="text-sm font-medium text-red-600">{editError}</p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="secondary"
                size="md"
                className="border border-ink/10"
                onClick={() => setIsEditOpen(false)}
              >
                Cancel
              </Button>
              <Button
                size="md"
                onClick={handleSaveEdit}
                disabled={editSubmitting}
              >
                {editSubmitting ? "Saving…" : "Save Changes"}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

const inputClass =
  "w-full rounded-md border border-black/10 px-3 py-2 text-sm text-ink focus:border-brand-blue focus:outline-none";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold tracking-wide text-muted uppercase">
        {label}
      </span>
      {children}
    </label>
  );
}
