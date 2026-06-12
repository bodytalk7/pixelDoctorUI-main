import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/layout/sidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const patients = await prisma.patient.findMany({
    where: {
      ...(session.user.role !== "ADMIN" && { doctorId: session.user.id }),
      ...(session.user.hospitalUnitId && { hospitalUnitId: session.user.hospitalUnitId }),
    },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      name: true,
      patientCode: true,
      updatedAt: true,
      visits: {
        orderBy: { visitedAt: "desc" },
        take: 1,
        select: { id: true, visitedAt: true },
      },
    },
  });

  return (
    <div style={{ display: "flex", height: "100vh", background: "#ffffff", overflow: "hidden" }}>
      <Sidebar user={session.user} patients={patients as any} />
      <main style={{ flex: 1, overflowY: "auto", height: "100vh" }}>
        {children}
      </main>
    </div>
  );
}