import InvoiceDetailPage from '@/components/InvoiceDetailPage';
export const dynamic = 'force-dynamic';

export default async function Page({ params }) {
  const resolvedParams = await params;
  return <InvoiceDetailPage params={resolvedParams} />;
}
