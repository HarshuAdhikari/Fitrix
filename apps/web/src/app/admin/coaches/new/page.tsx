import { CreateCoachForm } from "../_components/CreateCoachForm";

export const dynamic = "force-dynamic";

export default function NewCoachPage() {
  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-medium text-violet-600">Admin console</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
          Add coach
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Provision an independent coach account manually.
        </p>
      </header>
      <CreateCoachForm />
    </div>
  );
}
