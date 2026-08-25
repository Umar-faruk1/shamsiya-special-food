import ShamsiyaDashboard from '@/components/shamsiya-dashboard'
import ShamsiyaCustomers from '@/components/shamsiya-customers'

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <ShamsiyaDashboard><ShamsiyaCustomers detailId={id} /></ShamsiyaDashboard>
}
