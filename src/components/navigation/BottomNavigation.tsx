/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { LayoutDashboard, Ticket, ClipboardPen, CalendarClock, MoreHorizontal } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ModuleId } from '../../types';
import { canAccessModule } from '../../utils/rbac';
import { motion } from 'motion/react';
import { TRANSLATIONS } from '../../i18n/translations';

interface BottomNavigationProps {
  onOpenMoreMenu: () => void;
  id?: string;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({ onOpenMoreMenu, id }) => {
  const { currentModule, setCurrentModule, currentUser, language } = useApp();
  const [permRevision, setPermRevision] = React.useState(0);

  const t = TRANSLATIONS[language];

  React.useEffect(() => {
    const handlePermUpdate = () => {
      setPermRevision(r => r + 1);
    };
    window.addEventListener('tedos_permissions_updated', handlePermUpdate);
    return () => window.removeEventListener('tedos_permissions_updated', handlePermUpdate);
  }, []);

  const navItems = [
    { id: ModuleId.DASHBOARD, label: t.dashboard, icon: LayoutDashboard },
    { id: ModuleId.TICKETS, label: t.ticketCenter, icon: Ticket },
    { id: ModuleId.DAILY_WORK_LOG, label: t.dailyWorkLog, icon: ClipboardPen },
    { id: ModuleId.FOLLOW_UP, label: t.followUps, icon: CalendarClock },
  ].filter(item => canAccessModule(currentUser?.role, item.id));

  return (
    <div
      id={id}
      className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-md-surface-container-high border-t border-md-surface-variant px-2 pb-safe z-40 flex items-center justify-around"
    >
      {navItems.map((item) => {
        const isActive = currentModule === item.id || (item.id === ModuleId.CLIENTS && currentModule === ModuleId.CLIENT_WORKSPACE);
        const Icon = item.icon;

        return (
          <button
            key={item.id}
            id={`bottom-nav-${item.id}`}
            onClick={() => setCurrentModule(item.id)}
            className="flex flex-col items-center justify-center flex-1 h-full min-w-0 group cursor-pointer"
          >
            <div className="relative py-1 px-5 rounded-full flex items-center justify-center transition-colors">
              {isActive && (
                <motion.div
                  layoutId="active-nav-pill"
                  className="absolute inset-0 bg-md-primary-container rounded-full"
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                />
              )}
              <Icon
                size={22}
                className={`relative z-10 transition-colors duration-200 ${
                  isActive ? 'text-md-on-primary-container' : 'text-md-on-surface-variant/80'
                }`}
              />
            </div>
            <span
              className={`text-[10px] mt-1 font-medium tracking-wide truncate relative z-10 transition-colors duration-200 ${
                isActive ? 'text-md-primary font-bold' : 'text-md-on-surface-variant/70'
              }`}
            >
              {item.label}
            </span>
          </button>
        );
      })}

      {/* More / All Modules Button */}
      <button
        id="bottom-nav-more"
        onClick={onOpenMoreMenu}
        className="flex flex-col items-center justify-center flex-1 h-full min-w-0 cursor-pointer"
      >
        <div className="relative py-1 px-5 rounded-full flex items-center justify-center">
          {/* Active indicator check if we are in reports, settings, etc */}
          {[ModuleId.TRAINING, ModuleId.WHATSAPP, ModuleId.REPORTS, ModuleId.NOTIFICATIONS, ModuleId.AI_ASSISTANT, ModuleId.SETTINGS].includes(currentModule) && (
            <div className="absolute inset-0 bg-md-secondary-container rounded-full" />
          )}
          <MoreHorizontal
            size={22}
            className={`relative z-10 text-md-on-surface-variant/80`}
          />
        </div>
        <span className="text-[10px] mt-1 font-medium tracking-wide text-md-on-surface-variant/70 truncate">
          {language === 'ur' ? 'مزید' : 'More'}
        </span>
      </button>
    </div>
  );
};
