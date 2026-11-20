/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { ModuleId, UserRole } from '../../types';
import { getLocalDateString, getLocalDateOffsetString } from '../../utils/helpers';
import { DashboardGreetingAndLaunchHub } from './dashboard/DashboardGreetingAndLaunchHub';
import { DashboardSummaryCards } from './dashboard/DashboardSummaryCards';
import { DashboardDaybookExportPanel, DaybookRangeFilter } from './dashboard/DashboardDaybookExportPanel';
import { DashboardPriorityAndTimeline } from './dashboard/DashboardPriorityAndTimeline';
import { DashboardOpsAndStatus } from './dashboard/DashboardOpsAndStatus';

interface DashboardViewProps {
  id?: string;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ id }) => {
  const {
    currentUser,
    clients,
    followUps,
    workLogs,
    users,
    setCurrentModule,
    setSelectedClientId,
    branding,
    language,
    openPendingProofModal,
  } = useApp();

  const isUrdu = language === 'ur';

  const [searchQuery, setSearchQuery] = useState('');
  const [liveTime, setLiveTime] = useState(new Date());
  const [dashboardLogDate, setDashboardLogDate] = useState<string>(() => getLocalDateString());
  const [dashboardDaybookRange, setDashboardDaybookRange] = useState<DaybookRangeFilter>('ALL');
  const [dashboardExecFilter, setDashboardExecFilter] = useState<string>('ALL');
  const [isTeamSummaryModalOpen, setTeamSummaryModalOpen] = useState<boolean>(false);

  useEffect(() => {
    const timer = setInterval(() => setLiveTime(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  const getGreeting = () => {
    const hr = liveTime.getHours();
    if (isUrdu) {
      if (hr < 12) return 'صبح بخیر';
      if (hr < 17) return 'دوپہر بخیر';
      return 'شام بخیر';
    }
    if (hr < 12) return 'Good Morning';
    if (hr < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getFormattedDate = () => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };
    return liveTime.toLocaleDateString(isUrdu ? 'ur-PK' : 'en-US', options);
  };

  const handleClientClick = (clientId: string) => {
    setSelectedClientId(clientId);
    setCurrentModule(ModuleId.CLIENT_WORKSPACE);
  };

  const isSupportExecutive = currentUser?.role === UserRole.SUPPORT_EXECUTIVE;
  const currentExecName = (currentUser?.name || '').trim().toLowerCase();
  const firstToken = currentExecName.split(' ')[0];

  const myClients = isSupportExecutive
    ? clients.filter((c) => {
        const assigned = (c.assignedExecutive || c.assignedSupport || '').toLowerCase().trim();
        return assigned === currentExecName || (firstToken && assigned.includes(firstToken));
      })
    : clients;
  const assignedClientsCount = myClients.length;

  const scopedFollowups = isSupportExecutive
    ? followUps.filter((f) => {
        const exec = (f.executiveName || '').toLowerCase().trim();
        return exec === currentExecName || (firstToken && exec.includes(firstToken));
      })
    : followUps;
  const activeFollowups = scopedFollowups.filter((f) => f.status === 'Pending');
  const todaysFollowupsCount = activeFollowups.length;
  const overdueFollowupsCount = scopedFollowups.filter((f) => f.status === 'Overdue').length;

  const todayDateStr = getLocalDateString(liveTime);
  const scopedWorkLogs = isSupportExecutive
    ? workLogs.filter((l) => {
        const exec = (l.executiveName || l.supportName || '').toLowerCase().trim();
        return exec === currentExecName || (firstToken && exec.includes(firstToken));
      })
    : workLogs;
  const todaysWorkLogsCount = scopedWorkLogs.filter((l) => l.date === todayDateStr).length;
  const pendingTasksCount = activeFollowups.length + overdueFollowupsCount;

  const filteredClients = searchQuery.trim()
    ? clients.filter(
        (c) =>
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.company.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const urgentClients = clients.filter((c) => c.healthStatus < 50);
  const highPriorityFollowups = followUps.filter((f) => f.priority === 'High' && f.status === 'Pending');

  const trainingRequiredClients = clients.slice(0, 2).map((c) => ({
    id: c.id,
    name: c.name,
    company: c.company,
    trainingTopic: isUrdu ? 'سافٹ ویئر ابتدائی ٹریننگ v5.0' : 'v5.0-SaaS System Orientation & Billing Setup',
  }));
  const pendingTrainingsCount = trainingRequiredClients.length;

  const filteredDashboardWorkLogs = useMemo(() => {
    const now = new Date();
    const todayStr = getLocalDateString(now);
    const yesterdayStr = getLocalDateOffsetString(-1, now);

    return workLogs.filter((l) => {
      if (dashboardExecFilter !== 'ALL') {
        const execLower = (l.executiveName || l.supportName || '').toLowerCase();
        if (!execLower.includes(dashboardExecFilter.toLowerCase().split(' ')[0])) return false;
      }
      if (dashboardDaybookRange === 'TODAY') return l.date === todayStr;
      if (dashboardDaybookRange === 'YESTERDAY') return l.date === yesterdayStr;
      if (dashboardDaybookRange === 'CUSTOM_DATE') return l.date === dashboardLogDate;
      if (dashboardDaybookRange === 'THIS_WEEK') {
        return now.getTime() - new Date(l.date).getTime() <= 7 * 86400000;
      }
      if (dashboardDaybookRange === 'LAST_WEEK') {
        const diffDays = (now.getTime() - new Date(l.date).getTime()) / 86400000;
        return diffDays > 7 && diffDays <= 14;
      }
      return true;
    });
  }, [workLogs, dashboardExecFilter, dashboardDaybookRange, dashboardLogDate]);

  const recentlyAssignedClients = clients.filter((c) => c.status === 'Warning' || c.status === 'Active').slice(0, 2);

  return (
    <div id={id} className="space-y-6 max-w-5xl mx-auto pb-12 animate-slide-up">
      <DashboardGreetingAndLaunchHub
        isUrdu={isUrdu}
        companyName={branding.companyName}
        brandTagline={branding.brandTagline}
        greeting={getGreeting()}
        formattedDate={getFormattedDate()}
        userName={currentUser?.name || 'Executive'}
        userRole={currentUser?.role || 'Support Executive'}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filteredClients={filteredClients}
        urgentClientsCount={urgentClients.length}
        onSelectClient={handleClientClick}
        onStartDailyWorkLog={() => {
          setSelectedClientId(null);
          setCurrentModule(ModuleId.DAILY_WORK_LOG);
        }}
        onNavigateModule={setCurrentModule}
        onOpenPendingProofModal={openPendingProofModal}
      />

      <DashboardSummaryCards
        isUrdu={isUrdu}
        assignedClientsCount={assignedClientsCount}
        todaysFollowupsCount={todaysFollowupsCount}
        overdueFollowupsCount={overdueFollowupsCount}
        pendingTrainingsCount={pendingTrainingsCount}
        todaysWorkLogsCount={todaysWorkLogsCount}
        pendingTasksCount={pendingTasksCount}
        onNavigateModule={setCurrentModule}
        onOpenTeamSummary={() => setTeamSummaryModalOpen(true)}
      />

      <DashboardDaybookExportPanel
        isUrdu={isUrdu}
        currentUser={currentUser}
        users={users}
        clients={clients}
        filteredWorkLogs={filteredDashboardWorkLogs}
        dashboardExecFilter={dashboardExecFilter}
        onExecFilterChange={setDashboardExecFilter}
        dashboardDaybookRange={dashboardDaybookRange}
        onDaybookRangeChange={setDashboardDaybookRange}
        dashboardLogDate={dashboardLogDate}
        onLogDateChange={setDashboardLogDate}
      />

      <DashboardPriorityAndTimeline
        isUrdu={isUrdu}
        currentUser={currentUser}
        clients={clients}
        urgentClients={urgentClients}
        highPriorityFollowups={highPriorityFollowups}
        trainingRequiredClients={trainingRequiredClients}
        recentlyAssignedClients={recentlyAssignedClients}
        workLogs={workLogs}
        followUps={followUps}
        onSelectClient={handleClientClick}
      />

      <DashboardOpsAndStatus
        isUrdu={isUrdu}
        currentUser={currentUser}
        users={users}
        clients={clients}
        workLogs={workLogs}
        followUps={followUps}
        todaysWorkLogsCount={todaysWorkLogsCount}
        isTeamSummaryModalOpen={isTeamSummaryModalOpen}
        onOpenPendingProofModal={openPendingProofModal}
        onOpenTeamSummaryModal={() => setTeamSummaryModalOpen(true)}
        onCloseTeamSummaryModal={() => setTeamSummaryModalOpen(false)}
      />
    </div>
  );
};
