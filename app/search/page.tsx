import { redirect } from 'next/navigation'

interface SearchPageProps {
  searchParams?: Promise<{ q?: string; keyword?: string }>
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams
  const query = params?.q || params?.keyword
  if (query) {
    redirect(`/?keyword=${encodeURIComponent(query)}`)
  }
  redirect('/')
}
