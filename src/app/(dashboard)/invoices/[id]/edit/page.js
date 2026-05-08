import EditInvoicePage from '@/components/EditInvoicePage';
export const dynamic = 'force-dynamic';

export default async function Page({ params }) {
  const resolvedParams = await params;
  return <EditInvoicePage params={resolvedParams} />;
}
