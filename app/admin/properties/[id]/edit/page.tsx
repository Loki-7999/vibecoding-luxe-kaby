import AdminPropertyFormScreen from "@/components/admin/AdminPropertyFormScreen";

export default async function AdminEditPropertyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <AdminPropertyFormScreen propertyId={id} />;
}
