import { Routes } from '@angular/router';

import { authGuard } from '@core/guards/auth.guard';

/** Task management (Phase 4), shared by every authenticated role — backed by the real TaskService, row-scoped by the API. */
export const tasksRoutes: Routes = [
  {
    path: '',
    title: 'Tasks — FINOOCEAN',
    canActivate: [authGuard],
    loadComponent: () => import('./tasks.component').then((m) => m.TasksComponent),
  },
  {
    path: 'calls',
    title: 'Calls — FINOOCEAN',
    canActivate: [authGuard],
    loadComponent: () => import('./calls/task-calls.component').then((m) => m.TaskCallsComponent),
  },
  {
    path: 'meetings',
    title: 'Meetings — FINOOCEAN',
    canActivate: [authGuard],
    loadComponent: () => import('./meetings/task-meetings.component').then((m) => m.TaskMeetingsComponent),
  },
  {
    path: 'reminders',
    title: 'Reminders — FINOOCEAN',
    canActivate: [authGuard],
    loadComponent: () => import('./reminders/task-reminders.component').then((m) => m.TaskRemindersComponent),
  },
  {
    path: 'follow-ups',
    title: 'Follow-ups — FINOOCEAN',
    canActivate: [authGuard],
    loadComponent: () => import('./follow-ups/task-follow-ups.component').then((m) => m.TaskFollowUpsComponent),
  },
];
