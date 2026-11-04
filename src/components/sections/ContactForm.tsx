import { useEffect, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { Button } from "@/components/ui";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ?? "https://mf-ventures.duckdns.org:8050";

interface FormState {
  name: string;
  email: string;
  phone: string;
  company: string;
  service: string;
  message: string;
  /** Honeypot field: real visitors never see or fill this in. Any value means a bot. */
  website: string;
}

interface ServiceOption {
  value: string;
  label: string;
}

const INITIAL_STATE: FormState = {
  name: "",
  email: "",
  phone: "",
  company: "",
  service: "",
  message: "",
  website: "",
};

type Status = "idle" | "submitting" | "success" | "error";
type ServicesStatus = "loading" | "ready" | "error";

export function ContactForm({
  submitLabel = "Request a Quote",
}: {
  submitLabel?: string;
}) {
  const [values, setValues] = useState<FormState>(INITIAL_STATE);
  const [status, setStatus] = useState<Status>("idle");
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [servicesStatus, setServicesStatus] =
    useState<ServicesStatus>("loading");

  useEffect(() => {
    let cancelled = false;

    async function loadServices() {
      try {
        const res = await fetch(`${API_BASE}/api/v1/contact/services`);
        if (!res.ok) throw new Error(`Request failed with ${res.status}`);
        const data: unknown = await res.json();
        const list = Array.isArray(data) ? (data as ServiceOption[]) : [];
        if (!cancelled) {
          setServices(list);
          setServicesStatus("ready");
        }
      } catch {
        if (!cancelled) setServicesStatus("error");
      }
    }

    loadServices();
    return () => {
      cancelled = true;
    };
  }, []);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // Silently drop anything a bot filled into the honeypot field.
    if (values.website.trim().length > 0) {
      setStatus("success");
      return;
    }

    setStatus("submitting");
    try {
      const res = await fetch(`${API_BASE}/api/v1/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name,
          email: values.email,
          phone: values.phone,
          company: values.company,
          service: values.service,
          message: values.message,
          website: values.website,
        }),
      });
      if (!res.ok) throw new Error(`Request failed with ${res.status}`);
      setStatus("success");
      setValues(INITIAL_STATE);
    } catch {
      setStatus("error");
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-black/5 sm:p-8"
    >
      <div className="space-y-5">
        <Field label="Name" htmlFor="name">
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            required
            maxLength={120}
            value={values.name}
            onChange={(e) => update("name", e.target.value)}
            placeholder="Enter your name"
            className={inputClasses}
          />
        </Field>

        <Field label="E-mail" htmlFor="email">
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            maxLength={160}
            value={values.email}
            onChange={(e) => update("email", e.target.value)}
            placeholder="Enter your email address"
            className={inputClasses}
          />
        </Field>

        <Field label="Phone number" htmlFor="phone">
          <input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            maxLength={30}
            value={values.phone}
            onChange={(e) => update("phone", e.target.value)}
            placeholder="Enter your phone number"
            className={inputClasses}
          />
        </Field>

        <Field label="Company (optional)" htmlFor="company">
          <input
            id="company"
            name="company"
            type="text"
            autoComplete="organization"
            maxLength={160}
            value={values.company}
            onChange={(e) => update("company", e.target.value)}
            placeholder="Enter your company name"
            className={inputClasses}
          />
        </Field>

        <Field label="Service" htmlFor="service">
          <select
            id="service"
            name="service"
            required
            value={values.service}
            onChange={(e) => update("service", e.target.value)}
            disabled={servicesStatus === "loading"}
            className={inputClasses}
          >
            <option value="" disabled>
              {servicesStatus === "loading"
                ? "Loading services…"
                : "Select a service"}
            </option>
            {services.map((service) => (
              <option key={service.value} value={service.value}>
                {service.label}
              </option>
            ))}
          </select>
          {servicesStatus === "error" && (
            <p className="mt-1.5 text-xs font-medium text-red-600">
              Couldn't load the services list. You can still submit the form.
            </p>
          )}
        </Field>

        <Field label="Inquiry" htmlFor="message">
          <textarea
            id="message"
            name="message"
            required
            maxLength={2000}
            rows={4}
            value={values.message}
            onChange={(e) => update("message", e.target.value)}
            placeholder="Tell us what you need"
            className={inputClasses}
          />
        </Field>

        {/* Honeypot: hidden from sighted users and screen readers, bots tend to fill every field. */}
        <div className="hidden" aria-hidden="true">
          <label htmlFor="website">Website</label>
          <input
            id="website"
            name="website"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={values.website}
            onChange={(e) => update("website", e.target.value)}
          />
        </div>

        <div className="flex items-center justify-between gap-4">
          {status === "success" && (
            <p className="text-sm font-medium text-emerald-600">
              Thanks — we'll be in touch.
            </p>
          )}
          {status === "error" && (
            <p className="text-sm font-medium text-red-600">
              Something went wrong. Try again.
            </p>
          )}
          <Button
            type="submit"
            className="ml-auto"
            disabled={status === "submitting"}
          >
            {status === "submitting" ? "Sending…" : submitLabel}
          </Button>
        </div>
      </div>
    </form>
  );
}

const inputClasses =
  "w-full rounded-md border border-black/10 bg-surface px-4 py-3 text-sm text-ink placeholder:text-muted/70 focus:border-brand-blue focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/20";

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-1.5 block text-sm font-semibold text-ink"
      >
        {label}
      </label>
      {children}
    </div>
  );
}
