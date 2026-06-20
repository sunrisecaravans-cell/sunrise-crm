// Sunrise CRM — Workshop Page
// Stage 1: Service jobs, PDI inspections, warranty tracker
// Talks to Supabase via the shared client (./supabase-client.js)

import { useEffect, useMemo, useState } from "react";
import { dbLoad, dbInsert, dbUpdate, isConnected } from "./supabase-client";

const COLORS = {
  orange: "#FF6B35",
  navy: "#0B2545",
  bg: "#F8F9FB",
  white: "#FFFFFF",
  border: "#E4E7EB",
  text: "#1A2138",
  textMid: "#5C6477",
  textLight: "#8A95A8",
  green: "#16A34A",
  amber: "#F59E0B",
  red: "#DC2626",
  blue: "#2563EB",
};

const STATUS_COLORS = {
  Booked: COLORS.blue,
  "Checked In": COLORS.amber,
  "In Progress": COLORS.orange,
  "Waiting on Parts": COLORS.amber,
  "Ready for Pickup": COLORS.green,
  Complete: COLORS.textMid,
  Cancelled: COLORS.textLight,
};

const PRIORITY_COLORS = {
  Low: COLORS.textLight,
  Normal: COLORS.blue,
  High: COLORS.amber,
  Urgent: COLORS.red,
};

const RESULT_COLORS = {
  Pass: COLORS.green,
  Fail: COLORS.red,
  "N/A": COLORS.textLight,
  "Requires Rectification": COLORS.amber,
  "Not Checked": COLORS.border,
};

const JOB_TYPES = [
  "PDI",
  "General Service",
  "Warranty Repair",
  "Insurance Repair",
  "Pre Sale Inspection",
  "Recall",
  "Other",
];

const STATUSES = [
  "Booked",
  "Checked In",
  "In Progress",
  "Waiting on Parts",
  "Ready for Pickup",
  "Complete",
  "Cancelled",
];

const PRIORITIES = ["Low", "Normal", "High", "Urgent"];
const TECHS = ["Glen", "Nick", "External"];
const CLAIM_STATUSES = [
  "Not Claimed",
  "Submitted",
  "Approved",
  "Rejected",
  "Partially Approved",
  "Paid",
];

// ────────────────────────────────────────────────────────────────────────────
// MAIN PAGE — tab switcher between Jobs / PDI / Warranty
// ────────────────────────────────────────────────────────────────────────────

export default function WorkshopPage({ customers = [] }) {
  const [tab, setTab] = useState("jobs");
  const [jobs, setJobs] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [openJobId, setOpenJobId] = useState(null);
  const [openPDIInspectionId, setOpenPDIInspectionId] = useState(null);
  const [showNewJob, setShowNewJob] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  async function refresh() {
    if (!isConnected()) return;
    setLoading(true);
    const [j, v] = await Promise.all([
      dbLoad("service_jobs_v2", "?order=created_at.desc&limit=500"),
      dbLoad("vehicles", "?order=created_at.desc&limit=2000"),
    ]);
    setJobs(j || []);
    setVehicles(v || []);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  const warrantyJobs = useMemo(() => jobs.filter((j) => j.warranty_claim), [jobs]);

  if (!isConnected()) {
    return <NotConnected />;
  }

  // PDI inspection view (full-screen modal)
  if (openPDIInspectionId) {
    return (
      <PDIInspectionView
        inspectionId={openPDIInspectionId}
        onClose={() => {
          setOpenPDIInspectionId(null);
          refresh();
        }}
      />
    );
  }

  // Job detail view (full-screen modal)
  if (openJobId) {
    return (
      <JobDetailView
        jobId={openJobId}
        customers={customers}
        vehicles={vehicles}
        onClose={() => {
          setOpenJobId(null);
          refresh();
        }}
        onOpenPDI={(id) => setOpenPDIInspectionId(id)}
      />
    );
  }

  return (
    <div style={{ padding: "24px 30px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h1 style={{ margin: 0, fontFamily: "'Sora',sans-serif", fontSize: "28px", color: COLORS.text }}>Workshop</h1>
          <div style={{ fontSize: "13px", color: COLORS.textMid, marginTop: "4px" }}>
            {jobs.length} total jobs · {warrantyJobs.length} warranty claims
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={refresh} style={btnSecondary} disabled={loading}>
            {loading ? "Refreshing…" : "Refresh"}
          </button>
          <button onClick={() => setShowNewJob(true)} style={btnPrimary}>
            + New Job
          </button>
        </div>
      </div>

      {statusMsg && (
        <div style={{ background: "#ECFDF5", color: COLORS.green, padding: "10px 14px", borderRadius: "8px", marginBottom: "16px", fontSize: "13px" }}>
          {statusMsg}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", gap: "4px", marginBottom: "16px", borderBottom: `1px solid ${COLORS.border}` }}>
        {[
          { id: "jobs", label: `All Jobs (${jobs.length})` },
          { id: "active", label: `In Workshop (${jobs.filter((j) => !["Complete", "Cancelled"].includes(j.status)).length})` },
          { id: "warranty", label: `Warranty (${warrantyJobs.length})` },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              ...tabBtn,
              borderBottom: tab === t.id ? `3px solid ${COLORS.orange}` : "3px solid transparent",
              color: tab === t.id ? COLORS.text : COLORS.textMid,
              fontWeight: tab === t.id ? 700 : 500,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "jobs" && <JobsTable jobs={jobs} customers={customers} vehicles={vehicles} onOpen={setOpenJobId} />}
      {tab === "active" && <JobsTable jobs={jobs.filter((j) => !["Complete", "Cancelled"].includes(j.status))} customers={customers} vehicles={vehicles} onOpen={setOpenJobId} />}
      {tab === "warranty" && <WarrantyTable jobs={warrantyJobs} customers={customers} vehicles={vehicles} onOpen={setOpenJobId} />}

      {showNewJob && (
        <NewJobModal
          customers={customers}
          vehicles={vehicles}
          onClose={() => setShowNewJob(false)}
          onCreated={async (job) => {
            setShowNewJob(false);
            await refresh();
            setStatusMsg(`Job ${job.job_number} created.`);
            setTimeout(() => setStatusMsg(""), 4000);
            setOpenJobId(job.id);
          }}
        />
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// JOBS TABLE
// ────────────────────────────────────────────────────────────────────────────

function JobsTable({ jobs, customers, vehicles, onOpen }) {
  const customerById = useMemo(() => Object.fromEntries(customers.map((c) => [c.id, c])), [customers]);
  const vehicleById = useMemo(() => Object.fromEntries(vehicles.map((v) => [v.id, v])), [vehicles]);

  if (jobs.length === 0) {
    return (
      <div style={{ background: COLORS.white, borderRadius: "12px", padding: "60px", textAlign: "center", color: COLORS.textMid }}>
        No jobs yet. Click <strong>+ New Job</strong> to start.
      </div>
    );
  }

  return (
    <div style={{ background: COLORS.white, borderRadius: "12px", overflow: "hidden", border: `1px solid ${COLORS.border}` }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "#F1F3F5", textAlign: "left", fontSize: "12px", textTransform: "uppercase", color: COLORS.textMid }}>
            <th style={th}>Job #</th>
            <th style={th}>Type</th>
            <th style={th}>Customer</th>
            <th style={th}>Van</th>
            <th style={th}>Tech</th>
            <th style={th}>Booked</th>
            <th style={th}>Priority</th>
            <th style={th}>Status</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((j) => {
            const cust = customerById[j.customer_id];
            const veh = vehicleById[j.vehicle_id];
            return (
              <tr
                key={j.id}
                onClick={() => onOpen(j.id)}
                style={{ cursor: "pointer", borderTop: `1px solid ${COLORS.border}`, transition: "background .15s" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#FAFBFC")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <td style={{ ...td, fontWeight: 600, color: COLORS.orange }}>{j.job_number || "—"}</td>
                <td style={td}>{j.job_type}</td>
                <td style={td}>{cust?.name || j.customer_id || "—"}</td>
                <td style={td}>{veh ? `${veh.make} ${veh.model}${veh.rego ? ` · ${veh.rego}` : ""}` : "—"}</td>
                <td style={td}>{j.assigned_to || "—"}</td>
                <td style={td}>{j.booked_date || "—"}</td>
                <td style={td}>
                  <Pill color={PRIORITY_COLORS[j.priority] || COLORS.textMid}>{j.priority}</Pill>
                </td>
                <td style={td}>
                  <Pill color={STATUS_COLORS[j.status] || COLORS.textMid}>{j.status}</Pill>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// WARRANTY TABLE
// ────────────────────────────────────────────────────────────────────────────

function WarrantyTable({ jobs, customers, vehicles, onOpen }) {
  const customerById = useMemo(() => Object.fromEntries(customers.map((c) => [c.id, c])), [customers]);
  const vehicleById = useMemo(() => Object.fromEntries(vehicles.map((v) => [v.id, v])), [vehicles]);

  const totals = useMemo(() => {
    return jobs.reduce(
      (acc, j) => {
        acc.claimed += Number(j.warranty_claim_amount || 0);
        acc.reimbursed += Number(j.warranty_reimbursed_amount || 0);
        return acc;
      },
      { claimed: 0, reimbursed: 0 }
    );
  }, [jobs]);
  const outstanding = totals.claimed - totals.reimbursed;

  if (jobs.length === 0) {
    return (
      <div style={{ background: COLORS.white, borderRadius: "12px", padding: "60px", textAlign: "center", color: COLORS.textMid }}>
        No warranty claims yet.
      </div>
    );
  }

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "16px" }}>
        <Stat label="Total Claimed" value={`$${totals.claimed.toLocaleString()}`} />
        <Stat label="Reimbursed" value={`$${totals.reimbursed.toLocaleString()}`} positive />
        <Stat label="Outstanding" value={`$${outstanding.toLocaleString()}`} negative={outstanding > 0} />
      </div>
      <div style={{ background: COLORS.white, borderRadius: "12px", overflow: "hidden", border: `1px solid ${COLORS.border}` }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#F1F3F5", textAlign: "left", fontSize: "12px", textTransform: "uppercase", color: COLORS.textMid }}>
              <th style={th}>Job #</th>
              <th style={th}>Manufacturer</th>
              <th style={th}>Customer</th>
              <th style={th}>Van</th>
              <th style={th}>Claimed</th>
              <th style={th}>Reimbursed</th>
              <th style={th}>Outstanding</th>
              <th style={th}>Status</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((j) => {
              const cust = customerById[j.customer_id];
              const veh = vehicleById[j.vehicle_id];
              const out = Number(j.warranty_claim_amount || 0) - Number(j.warranty_reimbursed_amount || 0);
              return (
                <tr key={j.id} onClick={() => onOpen(j.id)} style={{ cursor: "pointer", borderTop: `1px solid ${COLORS.border}` }}>
                  <td style={{ ...td, fontWeight: 600, color: COLORS.orange }}>{j.job_number || "—"}</td>
                  <td style={td}>{j.warranty_manufacturer || "—"}</td>
                  <td style={td}>{cust?.name || "—"}</td>
                  <td style={td}>{veh ? `${veh.make} ${veh.model}` : "—"}</td>
                  <td style={td}>${Number(j.warranty_claim_amount || 0).toLocaleString()}</td>
                  <td style={td}>${Number(j.warranty_reimbursed_amount || 0).toLocaleString()}</td>
                  <td style={{ ...td, color: out > 0 ? COLORS.red : COLORS.green, fontWeight: 600 }}>
                    ${out.toLocaleString()}
                  </td>
                  <td style={td}>
                    <Pill color={out > 0 ? COLORS.amber : COLORS.green}>{j.warranty_claim_status || "—"}</Pill>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// NEW JOB MODAL
// ────────────────────────────────────────────────────────────────────────────

function NewJobModal({ customers, vehicles, onClose, onCreated }) {
  const [customerId, setCustomerId] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [jobType, setJobType] = useState("PDI");
  const [priority, setPriority] = useState("Normal");
  const [assignedTo, setAssignedTo] = useState("Glen");
  const [bookedDate, setBookedDate] = useState(new Date().toISOString().split("T")[0]);
  const [estimatedHours, setEstimatedHours] = useState("");
  const [description, setDescription] = useState("");
  const [warrantyClaim, setWarrantyClaim] = useState(false);
  const [manufacturer, setManufacturer] = useState("");
  const [saving, setSaving] = useState(false);

  // Quick add a vehicle inline if none exists for this customer
  const customerVehicles = useMemo(() => {
    if (!customerId) return [];
    return vehicles.filter((v) => String(v.customer_id) === String(customerId));
  }, [vehicles, customerId]);

  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [vMake, setVMake] = useState("");
  const [vModel, setVModel] = useState("");
  const [vYear, setVYear] = useState("");
  const [vRego, setVRego] = useState("");
  const [vVin, setVVin] = useState("");

  async function handleAddVehicle() {
    if (!customerId || !vMake || !vModel) {
      alert("Customer, make, and model are required.");
      return;
    }
    const result = await dbInsert("vehicles", {
      customer_id: Number(customerId),
      make: vMake,
      model: vModel,
      year: vYear ? Number(vYear) : null,
      rego: vRego || null,
      vin: vVin || null,
    });
    if (result && result[0]) {
      setVehicleId(String(result[0].id));
      vehicles.push(result[0]);
      setShowAddVehicle(false);
      setVMake(""); setVModel(""); setVYear(""); setVRego(""); setVVin("");
    } else {
      alert("Failed to save vehicle. Check connection.");
    }
  }

  async function handleSave() {
    if (!customerId || !vehicleId || !jobType) {
      alert("Customer, vehicle and job type are required.");
      return;
    }
    setSaving(true);
    const job = {
      customer_id: Number(customerId),
      vehicle_id: Number(vehicleId),
      job_type: jobType,
      priority,
      status: "Booked",
      assigned_to: assignedTo,
      booked_date: bookedDate || null,
      estimated_hours: estimatedHours ? Number(estimatedHours) : null,
      description: description || null,
      warranty_claim: warrantyClaim,
      warranty_manufacturer: warrantyClaim ? manufacturer || null : null,
      warranty_claim_status: warrantyClaim ? "Not Claimed" : null,
    };
    const result = await dbInsert("service_jobs_v2", job);
    setSaving(false);
    if (result && result[0]) {
      onCreated(result[0]);
    } else {
      alert("Failed to create job. Check connection.");
    }
  }

  return (
    <Modal title="New Workshop Job" onClose={onClose} wide>
      <div style={{ display: "grid", gap: "14px" }}>
        <Field label="Customer">
          <select value={customerId} onChange={(e) => { setCustomerId(e.target.value); setVehicleId(""); }} style={inputStyle}>
            <option value="">Select customer…</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>{c.name} {c.phone ? `· ${c.phone}` : ""}</option>
            ))}
          </select>
        </Field>

        <Field label="Vehicle">
          {customerVehicles.length > 0 ? (
            <div style={{ display: "flex", gap: "8px" }}>
              <select value={vehicleId} onChange={(e) => setVehicleId(e.target.value)} style={{ ...inputStyle, flex: 1 }}>
                <option value="">Select vehicle…</option>
                {customerVehicles.map((v) => (
                  <option key={v.id} value={v.id}>{v.make} {v.model} {v.year || ""} {v.rego ? `(${v.rego})` : ""}</option>
                ))}
              </select>
              <button onClick={() => setShowAddVehicle(!showAddVehicle)} style={btnSecondary}>{showAddVehicle ? "Cancel" : "+ New Van"}</button>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: "12px", color: COLORS.textMid, marginBottom: "8px" }}>
                {customerId ? "No vehicles on file. Add one below." : "Select a customer first."}
              </div>
              {customerId && <button onClick={() => setShowAddVehicle(true)} style={btnSecondary}>+ Add Vehicle</button>}
            </div>
          )}
        </Field>

        {showAddVehicle && customerId && (
          <div style={{ border: `1px dashed ${COLORS.border}`, borderRadius: "8px", padding: "14px", background: "#FAFBFC" }}>
            <div style={{ fontSize: "13px", fontWeight: 600, marginBottom: "10px", color: COLORS.text }}>Quick-add van for this customer</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <input placeholder="Make (e.g. Sunset)" value={vMake} onChange={(e) => setVMake(e.target.value)} style={inputStyle} />
              <input placeholder="Model (e.g. Wildtrekker 19ft8)" value={vModel} onChange={(e) => setVModel(e.target.value)} style={inputStyle} />
              <input placeholder="Year" value={vYear} onChange={(e) => setVYear(e.target.value)} style={inputStyle} />
              <input placeholder="Rego" value={vRego} onChange={(e) => setVRego(e.target.value)} style={inputStyle} />
              <input placeholder="VIN" value={vVin} onChange={(e) => setVVin(e.target.value)} style={{ ...inputStyle, gridColumn: "span 2" }} />
            </div>
            <button onClick={handleAddVehicle} style={{ ...btnPrimary, marginTop: "10px" }}>Save Vehicle</button>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
          <Field label="Job Type">
            <select value={jobType} onChange={(e) => setJobType(e.target.value)} style={inputStyle}>
              {JOB_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Priority">
            <select value={priority} onChange={(e) => setPriority(e.target.value)} style={inputStyle}>
              {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
            </select>
          </Field>
          <Field label="Assigned To">
            <select value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} style={inputStyle}>
              {TECHS.map((t) => <option key={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Booked Date">
            <input type="date" value={bookedDate} onChange={(e) => setBookedDate(e.target.value)} style={inputStyle} />
          </Field>
          <Field label="Estimated Hours">
            <input type="number" step="0.5" value={estimatedHours} onChange={(e) => setEstimatedHours(e.target.value)} style={inputStyle} placeholder="e.g. 4" />
          </Field>
        </div>

        <Field label="Description">
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} style={{ ...inputStyle, minHeight: "70px" }} placeholder="What's the job? E.g. 'Water ingress in rear tunnel boot, customer reported after recent trip'" />
        </Field>

        <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: COLORS.text }}>
          <input type="checkbox" checked={warrantyClaim} onChange={(e) => setWarrantyClaim(e.target.checked)} />
          This is a warranty claim
        </label>

        {warrantyClaim && (
          <Field label="Warranty Manufacturer">
            <input value={manufacturer} onChange={(e) => setManufacturer(e.target.value)} style={inputStyle} placeholder="e.g. NDC, Oz Classic, etc." />
          </Field>
        )}

        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "8px" }}>
          <button onClick={onClose} style={btnSecondary}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={btnPrimary}>{saving ? "Creating…" : "Create Job"}</button>
        </div>
      </div>
    </Modal>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// JOB DETAIL VIEW (full page)
// ────────────────────────────────────────────────────────────────────────────

function JobDetailView({ jobId, customers, vehicles, onClose, onOpenPDI }) {
  const [job, setJob] = useState(null);
  const [parts, setParts] = useState([]);
  const [notes, setNotes] = useState([]);
  const [pdis, setPdis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [edited, setEdited] = useState({});
  const [savingMsg, setSavingMsg] = useState("");

  // Add-part inputs
  const [partName, setPartName] = useState("");
  const [partNumber, setPartNumber] = useState("");
  const [partQty, setPartQty] = useState(1);
  const [partCost, setPartCost] = useState("");
  const [partWarranty, setPartWarranty] = useState(false);

  // Add-note inputs
  const [noteText, setNoteText] = useState("");
  const [noteType, setNoteType] = useState("General");

  async function refresh() {
    setLoading(true);
    const [j, p, n, pdi] = await Promise.all([
      dbLoad("service_jobs_v2", `?id=eq.${jobId}`),
      dbLoad("job_parts", `?service_job_id=eq.${jobId}&order=created_at.desc`),
      dbLoad("job_notes_log", `?service_job_id=eq.${jobId}&order=created_at.desc`),
      dbLoad("pdi_inspections", `?service_job_id=eq.${jobId}&order=created_at.desc`),
    ]);
    setJob(j && j[0]);
    setParts(p || []);
    setNotes(n || []);
    setPdis(pdi || []);
    setEdited(j && j[0] ? { ...j[0] } : {});
    setLoading(false);
  }

  useEffect(() => { refresh(); }, [jobId]);

  if (loading || !job) {
    return (
      <div style={{ padding: "60px", textAlign: "center", color: COLORS.textMid }}>Loading…</div>
    );
  }

  const customer = customers.find((c) => c.id === job.customer_id);
  const vehicle = vehicles.find((v) => v.id === job.vehicle_id);

  async function saveEdits() {
    setSavingMsg("Saving…");
    const updates = {
      status: edited.status,
      priority: edited.priority,
      assigned_to: edited.assigned_to,
      booked_date: edited.booked_date,
      started_date: edited.started_date,
      completed_date: edited.completed_date,
      estimated_hours: edited.estimated_hours ? Number(edited.estimated_hours) : null,
      actual_hours: edited.actual_hours ? Number(edited.actual_hours) : null,
      labour_rate: edited.labour_rate ? Number(edited.labour_rate) : 140,
      description: edited.description,
      warranty_claim: edited.warranty_claim,
      warranty_manufacturer: edited.warranty_manufacturer,
      warranty_claim_status: edited.warranty_claim_status,
      warranty_claim_amount: edited.warranty_claim_amount ? Number(edited.warranty_claim_amount) : 0,
      warranty_reimbursed_amount: edited.warranty_reimbursed_amount ? Number(edited.warranty_reimbursed_amount) : 0,
      notes: edited.notes,
    };
    const result = await dbUpdate("service_jobs_v2", jobId, updates);
    if (result) {
      setSavingMsg("Saved.");
      setEditing(false);
      await refresh();
      setTimeout(() => setSavingMsg(""), 2500);
    } else {
      setSavingMsg("Save failed.");
    }
  }

  async function addPart() {
    if (!partName) return;
    const total = (Number(partQty) || 1) * (Number(partCost) || 0);
    await dbInsert("job_parts", {
      service_job_id: jobId,
      part_name: partName,
      part_number: partNumber || null,
      quantity: Number(partQty) || 1,
      unit_cost: Number(partCost) || 0,
      total_cost: total,
      warranty_claimable: partWarranty,
    });
    setPartName(""); setPartNumber(""); setPartQty(1); setPartCost(""); setPartWarranty(false);
    await refresh();
  }

  async function addNote() {
    if (!noteText) return;
    await dbInsert("job_notes_log", {
      service_job_id: jobId,
      note_type: noteType,
      content: noteText,
      created_by: "Current User",
    });
    setNoteText("");
    await refresh();
  }

  async function startPDI() {
    const result = await dbInsert("pdi_inspections", {
      vehicle_id: job.vehicle_id,
      service_job_id: jobId,
      inspected_by: job.assigned_to || "Glen",
    });
    if (result && result[0]) {
      // Trigger auto-populates the 95 checklist items
      onOpenPDI(result[0].id);
    }
  }

  return (
    <div style={{ padding: "24px 30px", maxWidth: "1200px", margin: "0 auto" }}>
      <button onClick={onClose} style={{ ...btnSecondary, marginBottom: "16px" }}>← Back to Workshop</button>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "20px", marginBottom: "20px" }}>
        <div>
          <div style={{ fontSize: "13px", color: COLORS.textMid, marginBottom: "4px" }}>{job.job_type}</div>
          <h1 style={{ margin: 0, fontFamily: "'Sora',sans-serif", fontSize: "26px", color: COLORS.text }}>
            {job.job_number}
          </h1>
          <div style={{ fontSize: "14px", color: COLORS.textMid, marginTop: "8px" }}>
            <strong>{customer?.name || "—"}</strong>
            {customer?.phone && <> · {customer.phone}</>}
            {vehicle && <> · {vehicle.make} {vehicle.model} {vehicle.year || ""}{vehicle.rego ? ` (${vehicle.rego})` : ""}</>}
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <Pill color={STATUS_COLORS[job.status] || COLORS.textMid}>{job.status}</Pill>
          <Pill color={PRIORITY_COLORS[job.priority] || COLORS.textMid}>{job.priority}</Pill>
          {!editing && <button onClick={() => setEditing(true)} style={btnSecondary}>Edit</button>}
          {editing && <button onClick={saveEdits} style={btnPrimary}>Save Changes</button>}
        </div>
      </div>

      {savingMsg && <div style={{ background: "#ECFDF5", color: COLORS.green, padding: "8px 12px", borderRadius: "8px", marginBottom: "16px", fontSize: "13px" }}>{savingMsg}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        {/* Left column — job details */}
        <div style={{ background: COLORS.white, borderRadius: "12px", padding: "20px", border: `1px solid ${COLORS.border}` }}>
          <SectionTitle>Job Details</SectionTitle>
          <Detail label="Status" editing={editing}>
            {editing ? (
              <select value={edited.status} onChange={(e) => setEdited({ ...edited, status: e.target.value })} style={inputStyle}>
                {STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
            ) : job.status}
          </Detail>
          <Detail label="Priority" editing={editing}>
            {editing ? (
              <select value={edited.priority} onChange={(e) => setEdited({ ...edited, priority: e.target.value })} style={inputStyle}>
                {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
              </select>
            ) : job.priority}
          </Detail>
          <Detail label="Assigned" editing={editing}>
            {editing ? (
              <select value={edited.assigned_to || ""} onChange={(e) => setEdited({ ...edited, assigned_to: e.target.value })} style={inputStyle}>
                {TECHS.map((t) => <option key={t}>{t}</option>)}
              </select>
            ) : job.assigned_to || "—"}
          </Detail>
          <Detail label="Booked" editing={editing}>
            {editing ? <input type="date" value={edited.booked_date || ""} onChange={(e) => setEdited({ ...edited, booked_date: e.target.value })} style={inputStyle} /> : job.booked_date || "—"}
          </Detail>
          <Detail label="Started" editing={editing}>
            {editing ? <input type="date" value={edited.started_date || ""} onChange={(e) => setEdited({ ...edited, started_date: e.target.value })} style={inputStyle} /> : job.started_date || "—"}
          </Detail>
          <Detail label="Completed" editing={editing}>
            {editing ? <input type="date" value={edited.completed_date || ""} onChange={(e) => setEdited({ ...edited, completed_date: e.target.value })} style={inputStyle} /> : job.completed_date || "—"}
          </Detail>
          <Detail label="Est. hours" editing={editing}>
            {editing ? <input type="number" step="0.5" value={edited.estimated_hours || ""} onChange={(e) => setEdited({ ...edited, estimated_hours: e.target.value })} style={inputStyle} /> : (job.estimated_hours || "—")}
          </Detail>
          <Detail label="Actual hours" editing={editing}>
            {editing ? <input type="number" step="0.5" value={edited.actual_hours || ""} onChange={(e) => setEdited({ ...edited, actual_hours: e.target.value })} style={inputStyle} /> : (job.actual_hours || "—")}
          </Detail>
          <Detail label="Labour rate $/hr" editing={editing}>
            {editing ? <input type="number" value={edited.labour_rate || 140} onChange={(e) => setEdited({ ...edited, labour_rate: e.target.value })} style={inputStyle} /> : `$${job.labour_rate || 140}`}
          </Detail>
          <Detail label="Parts cost">${Number(job.parts_cost || 0).toLocaleString()}</Detail>
          <Detail label="Total"><strong>${Number(job.total_cost || 0).toLocaleString()}</strong></Detail>
          <Detail label="Description" editing={editing}>
            {editing ? <textarea value={edited.description || ""} onChange={(e) => setEdited({ ...edited, description: e.target.value })} style={{ ...inputStyle, minHeight: "80px" }} /> : (job.description || "—")}
          </Detail>
        </div>

        {/* Right column — warranty + PDI */}
        <div>
          {/* Warranty card */}
          <div style={{ background: COLORS.white, borderRadius: "12px", padding: "20px", border: `1px solid ${COLORS.border}`, marginBottom: "16px" }}>
            <SectionTitle>Warranty</SectionTitle>
            {editing ? (
              <>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px" }}>
                  <input type="checkbox" checked={edited.warranty_claim} onChange={(e) => setEdited({ ...edited, warranty_claim: e.target.checked })} />
                  This is a warranty claim
                </label>
                {edited.warranty_claim && (
                  <>
                    <Detail label="Manufacturer" editing>
                      <input value={edited.warranty_manufacturer || ""} onChange={(e) => setEdited({ ...edited, warranty_manufacturer: e.target.value })} style={inputStyle} placeholder="NDC, Oz Classic…" />
                    </Detail>
                    <Detail label="Claim status" editing>
                      <select value={edited.warranty_claim_status || "Not Claimed"} onChange={(e) => setEdited({ ...edited, warranty_claim_status: e.target.value })} style={inputStyle}>
                        {CLAIM_STATUSES.map((s) => <option key={s}>{s}</option>)}
                      </select>
                    </Detail>
                    <Detail label="Claim amount $" editing>
                      <input type="number" value={edited.warranty_claim_amount || ""} onChange={(e) => setEdited({ ...edited, warranty_claim_amount: e.target.value })} style={inputStyle} />
                    </Detail>
                    <Detail label="Reimbursed $" editing>
                      <input type="number" value={edited.warranty_reimbursed_amount || ""} onChange={(e) => setEdited({ ...edited, warranty_reimbursed_amount: e.target.value })} style={inputStyle} />
                    </Detail>
                  </>
                )}
              </>
            ) : job.warranty_claim ? (
              <>
                <Detail label="Manufacturer">{job.warranty_manufacturer || "—"}</Detail>
                <Detail label="Status"><Pill color={COLORS.amber}>{job.warranty_claim_status || "—"}</Pill></Detail>
                <Detail label="Claimed">${Number(job.warranty_claim_amount || 0).toLocaleString()}</Detail>
                <Detail label="Reimbursed">${Number(job.warranty_reimbursed_amount || 0).toLocaleString()}</Detail>
                <Detail label="Outstanding"><strong style={{ color: COLORS.red }}>${(Number(job.warranty_claim_amount || 0) - Number(job.warranty_reimbursed_amount || 0)).toLocaleString()}</strong></Detail>
              </>
            ) : (
              <div style={{ fontSize: "13px", color: COLORS.textMid }}>Not a warranty job. Click <em>Edit</em> to flag it.</div>
            )}
          </div>

          {/* PDI inspections */}
          <div style={{ background: COLORS.white, borderRadius: "12px", padding: "20px", border: `1px solid ${COLORS.border}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <SectionTitle nomargin>PDI Inspections</SectionTitle>
              <button onClick={startPDI} style={btnPrimary}>+ Start PDI</button>
            </div>
            {pdis.length === 0 ? (
              <div style={{ fontSize: "13px", color: COLORS.textMid }}>No PDI inspections yet.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {pdis.map((p) => (
                  <div key={p.id} onClick={() => onOpenPDI(p.id)} style={{ border: `1px solid ${COLORS.border}`, borderRadius: "8px", padding: "12px", cursor: "pointer" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <strong>{p.inspection_date}</strong>
                      <Pill color={p.overall_result === "Pass" ? COLORS.green : p.overall_result === "Fail" ? COLORS.red : COLORS.amber}>{p.overall_result}</Pill>
                    </div>
                    <div style={{ fontSize: "12px", color: COLORS.textMid, marginTop: "4px" }}>by {p.inspected_by}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Parts (full width) */}
        <div style={{ gridColumn: "span 2", background: COLORS.white, borderRadius: "12px", padding: "20px", border: `1px solid ${COLORS.border}` }}>
          <SectionTitle>Parts ({parts.length})</SectionTitle>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 80px 100px auto auto", gap: "8px", alignItems: "end", marginBottom: "12px" }}>
            <input placeholder="Part name" value={partName} onChange={(e) => setPartName(e.target.value)} style={inputStyle} />
            <input placeholder="Part number" value={partNumber} onChange={(e) => setPartNumber(e.target.value)} style={inputStyle} />
            <input type="number" placeholder="Qty" value={partQty} onChange={(e) => setPartQty(e.target.value)} style={inputStyle} />
            <input type="number" step="0.01" placeholder="$ each" value={partCost} onChange={(e) => setPartCost(e.target.value)} style={inputStyle} />
            <label style={{ fontSize: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
              <input type="checkbox" checked={partWarranty} onChange={(e) => setPartWarranty(e.target.checked)} /> Warranty
            </label>
            <button onClick={addPart} style={btnPrimary}>Add</button>
          </div>
          {parts.length > 0 && (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ textAlign: "left", color: COLORS.textMid, fontSize: "12px", textTransform: "uppercase" }}>
                  <th style={th}>Part</th>
                  <th style={th}>Number</th>
                  <th style={th}>Qty</th>
                  <th style={th}>Unit</th>
                  <th style={th}>Total</th>
                  <th style={th}>Warranty</th>
                </tr>
              </thead>
              <tbody>
                {parts.map((p) => (
                  <tr key={p.id} style={{ borderTop: `1px solid ${COLORS.border}` }}>
                    <td style={td}>{p.part_name}</td>
                    <td style={td}>{p.part_number || "—"}</td>
                    <td style={td}>{p.quantity}</td>
                    <td style={td}>${Number(p.unit_cost || 0).toFixed(2)}</td>
                    <td style={td}>${Number(p.total_cost || 0).toFixed(2)}</td>
                    <td style={td}>{p.warranty_claimable ? "✓" : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Notes log (full width) */}
        <div style={{ gridColumn: "span 2", background: COLORS.white, borderRadius: "12px", padding: "20px", border: `1px solid ${COLORS.border}` }}>
          <SectionTitle>Notes & Activity ({notes.length})</SectionTitle>
          <div style={{ display: "grid", gridTemplateColumns: "150px 1fr auto", gap: "8px", marginBottom: "16px" }}>
            <select value={noteType} onChange={(e) => setNoteType(e.target.value)} style={inputStyle}>
              <option>General</option>
              <option>Status Change</option>
              <option>Parts Ordered</option>
              <option>Customer Contact</option>
              <option>Warranty Update</option>
              <option>Internal</option>
            </select>
            <input value={noteText} onChange={(e) => setNoteText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") addNote(); }} placeholder="Add a note…" style={inputStyle} />
            <button onClick={addNote} style={btnPrimary}>Add Note</button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {notes.map((n) => (
              <div key={n.id} style={{ borderLeft: `3px solid ${COLORS.orange}`, paddingLeft: "12px" }}>
                <div style={{ fontSize: "12px", color: COLORS.textMid }}>
                  <strong>{n.note_type}</strong> · {n.created_by || "—"} · {new Date(n.created_at).toLocaleString()}
                </div>
                <div style={{ fontSize: "14px", color: COLORS.text, marginTop: "2px" }}>{n.content}</div>
              </div>
            ))}
            {notes.length === 0 && <div style={{ fontSize: "13px", color: COLORS.textMid }}>No notes yet.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// PDI INSPECTION VIEW (the 95-item checklist)
// ────────────────────────────────────────────────────────────────────────────

function PDIInspectionView({ inspectionId, onClose }) {
  const [inspection, setInspection] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingMsg, setSavingMsg] = useState("");
  const [filter, setFilter] = useState("all");

  async function refresh() {
    setLoading(true);
    const [insp, list] = await Promise.all([
      dbLoad("pdi_inspections", `?id=eq.${inspectionId}`),
      dbLoad("pdi_checklist_items", `?pdi_inspection_id=eq.${inspectionId}&order=sort_order.asc`),
    ]);
    setInspection(insp && insp[0]);
    setItems(list || []);
    setLoading(false);
  }

  useEffect(() => { refresh(); }, [inspectionId]);

  async function setItemResult(item, result) {
    setItems(items.map((i) => (i.id === item.id ? { ...i, result } : i)));
    await dbUpdate("pdi_checklist_items", item.id, { result });
  }

  async function setItemNotes(item, notes) {
    setItems(items.map((i) => (i.id === item.id ? { ...i, notes } : i)));
    // Save on blur (don't save on every keystroke)
  }

  async function saveItemNotes(item) {
    await dbUpdate("pdi_checklist_items", item.id, { notes: item.notes });
  }

  async function setOverallResult(result) {
    await dbUpdate("pdi_inspections", inspectionId, { overall_result: result });
    setSavingMsg(`Marked as ${result}.`);
    await refresh();
    setTimeout(() => setSavingMsg(""), 2500);
  }

  async function customerSign() {
    await dbUpdate("pdi_inspections", inspectionId, {
      customer_signed: true,
      customer_signed_date: new Date().toISOString(),
    });
    setSavingMsg("Customer sign-off recorded.");
    await refresh();
    setTimeout(() => setSavingMsg(""), 2500);
  }

  if (loading || !inspection) {
    return <div style={{ padding: "60px", textAlign: "center", color: COLORS.textMid }}>Loading PDI…</div>;
  }

  const grouped = items.reduce((acc, item) => {
    if (!acc[item.section]) acc[item.section] = [];
    acc[item.section].push(item);
    return acc;
  }, {});

  const counts = items.reduce(
    (acc, i) => {
      acc.total++;
      if (i.result === "Pass") acc.pass++;
      else if (i.result === "Fail") acc.fail++;
      else if (i.result === "Requires Rectification") acc.rect++;
      else if (i.result === "N/A") acc.na++;
      else acc.unchecked++;
      return acc;
    },
    { total: 0, pass: 0, fail: 0, rect: 0, na: 0, unchecked: 0 }
  );

  const filteredGrouped = Object.fromEntries(
    Object.entries(grouped).map(([section, list]) => {
      const f = filter === "all" ? list : filter === "unchecked" ? list.filter((i) => i.result === "Not Checked") : list.filter((i) => i.result === filter);
      return [section, f];
    })
  );

  return (
    <div style={{ padding: "24px 30px", maxWidth: "1100px", margin: "0 auto" }}>
      <button onClick={onClose} style={{ ...btnSecondary, marginBottom: "16px" }}>← Back</button>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
        <div>
          <h1 style={{ margin: 0, fontFamily: "'Sora',sans-serif", fontSize: "26px" }}>PDI Inspection</h1>
          <div style={{ fontSize: "14px", color: COLORS.textMid, marginTop: "6px" }}>
            Inspected by <strong>{inspection.inspected_by}</strong> on {inspection.inspection_date}
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "flex-end" }}>
          <button onClick={() => setOverallResult("Pass")} style={{ ...btnSecondary, background: COLORS.green, color: "white", borderColor: COLORS.green }}>Mark Pass</button>
          <button onClick={() => setOverallResult("Fail")} style={{ ...btnSecondary, background: COLORS.red, color: "white", borderColor: COLORS.red }}>Mark Fail</button>
          <button onClick={() => setOverallResult("Pass with Notes")} style={{ ...btnSecondary, background: COLORS.amber, color: "white", borderColor: COLORS.amber }}>Pass with Notes</button>
        </div>
      </div>

      {savingMsg && <div style={{ background: "#ECFDF5", color: COLORS.green, padding: "8px 12px", borderRadius: "8px", marginBottom: "12px", fontSize: "13px" }}>{savingMsg}</div>}

      {/* Progress strip */}
      <div style={{ background: COLORS.white, borderRadius: "12px", padding: "16px", marginBottom: "20px", border: `1px solid ${COLORS.border}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
          <strong>Progress: {counts.total - counts.unchecked} of {counts.total}</strong>
          <Pill color={inspection.overall_result === "Pass" ? COLORS.green : inspection.overall_result === "Fail" ? COLORS.red : COLORS.amber}>{inspection.overall_result}</Pill>
        </div>
        <div style={{ display: "flex", gap: "16px", fontSize: "13px", color: COLORS.textMid, flexWrap: "wrap" }}>
          <span>✅ Pass: <strong style={{ color: COLORS.green }}>{counts.pass}</strong></span>
          <span>❌ Fail: <strong style={{ color: COLORS.red }}>{counts.fail}</strong></span>
          <span>⚠️ Requires Rectification: <strong style={{ color: COLORS.amber }}>{counts.rect}</strong></span>
          <span>⏸ N/A: <strong>{counts.na}</strong></span>
          <span>⬜ Not Checked: <strong>{counts.unchecked}</strong></span>
        </div>
      </div>

      {/* Filter */}
      <div style={{ display: "flex", gap: "6px", marginBottom: "12px", flexWrap: "wrap" }}>
        {["all", "unchecked", "Pass", "Fail", "Requires Rectification", "N/A"].map((f) => (
          <button key={f} onClick={() => setFilter(f)} style={{ ...btnSecondary, background: filter === f ? COLORS.navy : "transparent", color: filter === f ? "white" : COLORS.text, borderColor: filter === f ? COLORS.navy : COLORS.border, fontSize: "12px", padding: "6px 10px" }}>
            {f === "all" ? "All" : f === "unchecked" ? "Not Checked" : f}
          </button>
        ))}
      </div>

      {/* Sections */}
      {Object.entries(filteredGrouped).map(([section, list]) => (
        list.length > 0 && (
          <div key={section} style={{ background: COLORS.white, borderRadius: "12px", padding: "16px 20px", marginBottom: "12px", border: `1px solid ${COLORS.border}` }}>
            <div style={{ fontSize: "16px", fontWeight: 700, color: COLORS.text, marginBottom: "12px", fontFamily: "'Sora',sans-serif" }}>{section}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {list.map((item) => (
                <ChecklistItem
                  key={item.id}
                  item={item}
                  onSetResult={(r) => setItemResult(item, r)}
                  onSetNotes={(n) => setItemNotes(item, n)}
                  onSaveNotes={() => saveItemNotes(item)}
                />
              ))}
            </div>
          </div>
        )
      ))}

      {/* Customer sign-off */}
      <div style={{ background: COLORS.white, borderRadius: "12px", padding: "20px", marginTop: "20px", border: `1px solid ${COLORS.border}` }}>
        <SectionTitle>Customer Sign-off</SectionTitle>
        {inspection.customer_signed ? (
          <div style={{ background: "#ECFDF5", padding: "12px", borderRadius: "8px", color: COLORS.green, fontSize: "14px" }}>
            ✓ Signed off by customer on {new Date(inspection.customer_signed_date).toLocaleString()}
          </div>
        ) : (
          <>
            <div style={{ fontSize: "13px", color: COLORS.textMid, marginBottom: "12px" }}>
              Hand the tablet to the customer to confirm they've received the van as inspected.
            </div>
            <button onClick={customerSign} style={btnPrimary}>Customer Confirms ✓</button>
          </>
        )}
      </div>
    </div>
  );
}

function ChecklistItem({ item, onSetResult, onSetNotes, onSaveNotes }) {
  const [showNotes, setShowNotes] = useState(Boolean(item.notes));
  const opts = ["Pass", "Fail", "N/A", "Requires Rectification"];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "10px", padding: "10px", borderRadius: "8px", border: `1px solid ${item.result && item.result !== "Not Checked" ? RESULT_COLORS[item.result] : COLORS.border}`, background: item.result === "Fail" || item.result === "Requires Rectification" ? "#FEF2F2" : "white" }}>
      <div>
        <div style={{ fontSize: "14px", color: COLORS.text }}>{item.item_description}</div>
        {showNotes && (
          <textarea
            value={item.notes || ""}
            onChange={(e) => onSetNotes(e.target.value)}
            onBlur={onSaveNotes}
            placeholder="Notes / what was found / action taken"
            style={{ ...inputStyle, marginTop: "8px", minHeight: "50px", fontSize: "12px" }}
          />
        )}
      </div>
      <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", alignItems: "center" }}>
        {opts.map((o) => (
          <button
            key={o}
            onClick={() => onSetResult(o)}
            style={{
              padding: "6px 10px",
              fontSize: "11px",
              fontWeight: 600,
              borderRadius: "6px",
              border: `1px solid ${item.result === o ? RESULT_COLORS[o] : COLORS.border}`,
              background: item.result === o ? RESULT_COLORS[o] : "white",
              color: item.result === o ? "white" : COLORS.text,
              cursor: "pointer",
            }}
          >
            {o}
          </button>
        ))}
        <button onClick={() => setShowNotes(!showNotes)} style={{ ...btnSecondary, fontSize: "11px", padding: "6px 8px" }}>
          {showNotes ? "−" : "Note"}
        </button>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// SHARED UI HELPERS
// ────────────────────────────────────────────────────────────────────────────

function NotConnected() {
  return (
    <div style={{ padding: "80px 30px", textAlign: "center" }}>
      <div style={{ fontSize: "32px", marginBottom: "12px" }}>🔌</div>
      <h2 style={{ fontFamily: "'Sora',sans-serif", color: COLORS.text }}>Not connected to Supabase</h2>
      <div style={{ fontSize: "14px", color: COLORS.textMid }}>Open Settings and paste your Supabase URL and anon key.</div>
    </div>
  );
}

function Pill({ children, color }) {
  return (
    <span style={{ display: "inline-block", padding: "3px 10px", fontSize: "11px", fontWeight: 600, color: "white", background: color, borderRadius: "999px" }}>
      {children}
    </span>
  );
}

function Stat({ label, value, positive, negative }) {
  const color = positive ? COLORS.green : negative ? COLORS.red : COLORS.text;
  return (
    <div style={{ background: COLORS.white, borderRadius: "12px", padding: "16px", border: `1px solid ${COLORS.border}` }}>
      <div style={{ fontSize: "12px", color: COLORS.textMid, textTransform: "uppercase", fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: "24px", fontWeight: 700, color, fontFamily: "'Sora',sans-serif", marginTop: "4px" }}>{value}</div>
    </div>
  );
}

function SectionTitle({ children, nomargin }) {
  return <div style={{ fontSize: "13px", fontWeight: 700, color: COLORS.text, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: nomargin ? 0 : "12px", fontFamily: "'Sora',sans-serif" }}>{children}</div>;
}

function Detail({ label, children, editing }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: "10px", marginBottom: "8px", alignItems: "center", fontSize: "13px" }}>
      <div style={{ color: COLORS.textMid }}>{label}</div>
      <div style={{ color: COLORS.text }}>{children}</div>
    </div>
  );
}

function Modal({ title, children, onClose, wide }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(11,37,69,0.5)", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "60px 20px", zIndex: 100, overflowY: "auto" }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: COLORS.white, borderRadius: "12px", padding: "24px", width: "100%", maxWidth: wide ? "640px" : "480px", boxShadow: "0 20px 50px rgba(0,0,0,0.3)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h3 style={{ margin: 0, fontFamily: "'Sora',sans-serif", color: COLORS.text }}>{title}</h3>
          <button onClick={onClose} style={{ background: "transparent", border: "none", fontSize: "24px", cursor: "pointer", color: COLORS.textMid }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <div style={{ fontSize: "12px", fontWeight: 600, color: COLORS.textMid, marginBottom: "6px" }}>{label}</div>
      {children}
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "8px 10px",
  border: `1px solid ${COLORS.border}`,
  borderRadius: "6px",
  fontSize: "13px",
  background: "white",
  fontFamily: "inherit",
  boxSizing: "border-box",
};

const btnPrimary = {
  background: COLORS.orange,
  color: "white",
  border: "none",
  padding: "8px 16px",
  borderRadius: "8px",
  fontWeight: 600,
  fontSize: "13px",
  cursor: "pointer",
};

const btnSecondary = {
  background: "white",
  color: COLORS.text,
  border: `1px solid ${COLORS.border}`,
  padding: "8px 14px",
  borderRadius: "8px",
  fontWeight: 600,
  fontSize: "13px",
  cursor: "pointer",
};

const tabBtn = {
  background: "transparent",
  border: "none",
  padding: "12px 16px",
  fontSize: "13px",
  cursor: "pointer",
};

const th = { padding: "10px 14px", fontWeight: 600 };
const td = { padding: "10px 14px", fontSize: "13px", color: COLORS.text };
