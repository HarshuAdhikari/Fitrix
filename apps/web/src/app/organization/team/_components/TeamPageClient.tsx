"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";
import { OrganizationTeamTable } from "./OrganizationTeamTable";
import { AddMemberModal } from "./AddMemberModal";

type Role = "ADMIN" | "COACH" | "CLIENT";

interface TeamMember {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: Role;
  createdAt: string;
  isOwner: boolean;
  isCoach: boolean;
  isClient: boolean;
}

export function TeamPageClient({ members }: { members: TeamMember[] }) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between">
        <div /> {/* spacer — header is in the parent server component */}
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
        >
          <UserPlus className="h-4 w-4" />
          Add member
        </button>
      </div>

      <OrganizationTeamTable initialMembers={members} />

      {showModal ? (
        <AddMemberModal onClose={() => setShowModal(false)} />
      ) : null}
    </>
  );
}
