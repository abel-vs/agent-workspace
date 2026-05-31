import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { usePageTitle } from '@/hooks/use-page-title'
import { ProfilesScreen } from '@/screens/profiles/profiles-screen'
import { CrewScreen } from '@/screens/crew/crew-screen'

export const Route = createFileRoute('/profiles')({
  ssr: false,
  component: ProfilesRoute,
})

function ProfilesRoute() {
  usePageTitle('Profiles')
  const [tab, setTab] = useState<'profiles' | 'monitoring'>('profiles')

  return (
    <div className="min-h-full overflow-y-auto bg-background text-foreground">
      <div className="mx-auto w-full max-w-[1200px] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-5 flex gap-1 rounded-lg border border-border bg-background/85 p-1 backdrop-blur-xl">
          <button
            onClick={() => setTab('profiles')}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              tab === 'profiles'
                ? 'bg-card text-foreground shadow-sm dark:bg-neutral-800'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Profiles
          </button>
          <button
            onClick={() => setTab('monitoring')}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              tab === 'monitoring'
                ? 'bg-card text-foreground shadow-sm dark:bg-neutral-800'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Monitoring
          </button>
        </div>
        {tab === 'profiles' ? <ProfilesScreen /> : <CrewScreen />}
      </div>
    </div>
  )
}
