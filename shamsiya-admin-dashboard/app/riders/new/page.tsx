'use client'

import { useRouter } from 'next/navigation'
import ShamsiyaDashboard from '@/components/shamsiya-dashboard'
import { RiderFormModal } from '@/components/shamsiya-riders'

export default function NewRiderPage() {
  const router = useRouter()
  return <ShamsiyaDashboard><RiderFormModal onClose={() => router.push('/riders')} onSaved={async () => { router.push('/riders') }} /></ShamsiyaDashboard>
}