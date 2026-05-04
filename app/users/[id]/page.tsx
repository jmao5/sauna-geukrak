import { getUserProfile } from '@/app/actions/follow.actions'
import { getReviewsByUserId } from '@/app/actions/review.actions'
import UserProfileClient from './UserProfileClient'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const profile = await getUserProfile(id)
  if (!profile) return { title: '유저 프로필' }
  return {
    title: `${profile.nickname}의 사활`,
    description: profile.bio ?? `${profile.nickname}의 사우나 극락 사활 기록`,
  }
}

export default async function UserProfilePage({ params }: Props) {
  const { id } = await params
  const [profile, reviews] = await Promise.all([
    getUserProfile(id),
    getReviewsByUserId(id),
  ])
  if (!profile) notFound()

  return <UserProfileClient profile={profile} reviews={reviews} />
}
