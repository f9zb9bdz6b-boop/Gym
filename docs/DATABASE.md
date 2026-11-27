# Database Schema (Dexie.js / IndexedDB)

Database Name: `GymAppDB` (Schema Version 1)

## Tables (19)
1. `userProfile`
2. `bodyMetrics`
3. `workoutPlans`
4. `scheduledWorkouts`
5. `workoutSessions`
6. `exerciseLibrary`
7. `exerciseSets`
8. `foodItems`
9. `meals`
10. `foodLogs`
11. `nutritionTargets`
12. `activityLogs`
13. `dailyGoals`
14. `goalCompletions`
15. `sleepLogs`
16. `recoveryLogs`
17. `progressPhotos`
18. `aiConversations`
19. `appSettings`

All related writes (such as completing a workout session or updating profile + nutrition targets) use Dexie transactions (`db.transaction('rw', ...)`).
