/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TimelineEntry } from '../types';
import { getTimeline, saveTimeline } from '../storage/db';

export const logTimelineEvent = (
  clientId: string,
  type: TimelineEntry['type'],
  summary: string,
  summaryAr: string,
  category: TimelineEntry['category'],
  coachComments?: string
) => {
  const current = getTimeline();
  const dateStr = new Date();
  const formattedDate = dateStr.toISOString().split('T')[0];
  const formattedTime = dateStr.toTimeString().slice(0, 5);

  const icons: Record<string, string> = {
    client_created: 'UserPlus',
    workout_created: 'Plus',
    workout_updated: 'Dumbbell',
    nutrition_updated: 'Apple',
    inbody_created: 'Scale',
    checkin_submitted: 'ClipboardCheck',
    photos_added: 'Image',
    measurements_updated: 'Ruler',
    weight_changed: 'TrendingDown',
    goal_changed: 'Award',
    note_added: 'FileText',
    version_activated: 'Check',
    pdf_generated: 'FileSpreadsheet',
    client_archived: 'Archive',
    client_reactivated: 'RefreshCw',
    status_changed: 'TrendingUp'
  };

  const newEntry: TimelineEntry = {
    id: `tim_${Date.now()}`,
    clientId,
    date: formattedDate,
    time: formattedTime,
    type,
    icon: icons[type] || 'Activity',
    summary,
    summaryAr,
    category,
    coachComments
  };

  const updated = [newEntry, ...current];
  saveTimeline(updated);
};
