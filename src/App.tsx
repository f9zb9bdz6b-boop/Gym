import { useEffect, useState } from 'react';
import { ensureDatabaseSeeded } from '@/db/seed';
import { useAppStore } from '@/stores/useAppStore';
import { AppShell } from '@/components/layout/AppShell';
import { OnboardingModal } from '@/components/layout/OnboardingModal';
import { ToastContainer } from '@/components/ui/ToastContainer';
import { HomeDashboard } from '@/features/home/HomeDashboard';
import { WorkoutHub } from '@/features/workout/WorkoutHub';
import { ExerciseLibraryView } from '@/features/workout/ExerciseLibraryView';
import { NutritionHub } from '@/features/nutrition/NutritionHub';
import { CalculatorsView } from '@/features/nutrition/CalculatorsView';
import { ProgressHub } from '@/features/progress/ProgressHub';
import { ActivityGoalsView } from '@/features/progress/ActivityGoalsView';
import { RecoveryView } from '@/features/progress/RecoveryView';
import { AIAssistantView } from '@/features/ai/AIAssistantView';
import { FuturePlanningView } from '@/features/planning/FuturePlanningView';
import { ProfileView } from '@/features/settings/ProfileView';
import { BackupSettingsView } from '@/features/settings/BackupSettingsView';

export function App() {
  const { activeTab, subView, showOnboarding, setIsOnline } = useAppStore();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    ensureDatabaseSeeded().then(() => setReady(true));

    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, [setIsOnline]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-400 text-sm">
        Initializing local fitness database...
      </div>
    );
  }

  const renderContent = () => {
    if (subView === 'profile') return <ProfileView />;
    if (subView === 'calculators') return <CalculatorsView />;
    if (subView === 'library') return <ExerciseLibraryView />;
    if (subView === 'activity' || subView === 'goals') return <ActivityGoalsView />;
    if (subView === 'recovery') return <RecoveryView />;
    if (subView === 'planning') return <FuturePlanningView />;
    if (subView === 'backup' || subView === 'settings') return <BackupSettingsView />;

    switch (activeTab) {
      case 'home':
        return <HomeDashboard />;
      case 'workout':
        return <WorkoutHub />;
      case 'nutrition':
        return <NutritionHub />;
      case 'progress':
        return <ProgressHub />;
      case 'ai':
        return <AIAssistantView />;
      default:
        return <HomeDashboard />;
    }
  };

  return (
    <>
      <AppShell>{renderContent()}</AppShell>
      {showOnboarding && <OnboardingModal />}
      <ToastContainer />
    </>
  );
}

export default App;
