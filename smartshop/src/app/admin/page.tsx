import { AdminExperimentPanel } from "@/components/admin/AdminExperimentPanel";

export const metadata = {
  title: "Admin | SmartShop Experiment",
  description: "View and export participant experiment data",
};

export default function AdminPage() {
  return (
    <div className="container py-10 md:py-14">
      <AdminExperimentPanel />
    </div>
  );
}
