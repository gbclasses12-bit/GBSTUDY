/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState } from 'react';
import { AdminModal } from './components/AdminModal';
import { BatchStudyModal } from './components/BatchStudyModal';
import { CommunityModal } from './components/CommunityModal';
import { HomeView } from './components/HomeView';
import { NextToppersView } from './components/NextToppersView';
import { PhysicsWallahView } from './components/PhysicsWallahView';
import { SidebarDrawer } from './components/SidebarDrawer';
import { PLATFORMS as DEFAULT_PLATFORMS } from './data/platforms';
import { BatchItem, PlatformId, PlatformItem } from './types';

const STORAGE_PLATFORMS_KEY = 'gb_study_platforms_v1';

export default function App() {
  const [platforms, setPlatforms] = useState<PlatformItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_PLATFORMS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // ignore storage errors
    }
    return DEFAULT_PLATFORMS;
  });

  const [activePage, setActivePage] = useState<PlatformId>('home');
  const [recentPlatform, setRecentPlatform] = useState<PlatformId | null>(
    () => {
      try {
        const saved = localStorage.getItem('gb_study_recent');
        return saved ? saved : null;
      } catch {
        return null;
      }
    }
  );
  const [wishlist, setWishlist] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('gb_study_wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isCommunityModalOpen, setIsCommunityModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<BatchItem | null>(null);

  // 25 consecutive taps on GB STUDY icon to open Admin Panel
  const tapCountRef = useRef(0);
  const tapResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleLogoTap = () => {
    if (tapResetTimerRef.current) {
      clearTimeout(tapResetTimerRef.current);
    }
    tapCountRef.current += 1;
    if (tapCountRef.current >= 25) {
      tapCountRef.current = 0;
      setIsDrawerOpen(false);
      setIsAdminModalOpen(true);
      return;
    }
    tapResetTimerRef.current = setTimeout(() => {
      tapCountRef.current = 0;
    }, 3000);
  };

  // Show Join Community popup shortly after first load, matching the video
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsCommunityModalOpen(true);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const persistPlatforms = (next: PlatformItem[]) => {
    setPlatforms(next);
    try {
      localStorage.setItem(STORAGE_PLATFORMS_KEY, JSON.stringify(next));
    } catch {
      // ignore storage errors
    }
  };

  const handleAddPlatform = (platform: PlatformItem, position?: number) => {
    const next = [...platforms];
    if (position && position >= 1 && position <= next.length + 1) {
      next.splice(position - 1, 0, platform);
    } else {
      next.push(platform);
    }
    persistPlatforms(next);
  };

  const handleUpdatePlatform = (updated: PlatformItem, position?: number) => {
    const currentIdx = platforms.findIndex((p) => p.id === updated.id);
    if (currentIdx === -1) return;
    const next = platforms.map((p) => (p.id === updated.id ? updated : p));
    if (position && position >= 1 && position <= next.length) {
      const targetIdx = position - 1;
      if (targetIdx !== currentIdx) {
        const [item] = next.splice(currentIdx, 1);
        next.splice(targetIdx, 0, item);
      }
    }
    persistPlatforms(next);
  };

  const handleMovePlatform = (fromIndex: number, toIndex: number) => {
    if (
      fromIndex < 0 ||
      toIndex < 0 ||
      fromIndex >= platforms.length ||
      toIndex >= platforms.length ||
      fromIndex === toIndex
    ) {
      return;
    }
    const next = [...platforms];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    persistPlatforms(next);
  };

  const handleDeletePlatform = (id: string) => {
    persistPlatforms(platforms.filter((p) => p.id !== id));
    if (activePage === id) {
      setActivePage('home');
    }
  };

  const handleResetPlatforms = () => {
    persistPlatforms(DEFAULT_PLATFORMS);
  };

  const handleSelectPage = (id: PlatformId) => {
    setActivePage(id);
    if (id !== 'home') {
      setRecentPlatform(id);
      try {
        localStorage.setItem('gb_study_recent', id);
      } catch {
        // ignore storage errors
      }
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectPlatform = (platform: PlatformItem) => {
    setRecentPlatform(platform.id);
    try {
      localStorage.setItem('gb_study_recent', platform.id);
    } catch {
      // ignore storage errors
    }
    if (!platform.url) {
      setActivePage(platform.id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleToggleWishlist = (batchId: string) => {
    setWishlist((prev) => {
      const next = prev.includes(batchId)
        ? prev.filter((id) => id !== batchId)
        : [...prev, batchId];
      try {
        localStorage.setItem('gb_study_wishlist', JSON.stringify(next));
      } catch {
        // ignore storage errors
      }
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-[#060a08]">
      {activePage === 'home' && (
        <HomeView
          platforms={platforms}
          recentPlatform={recentPlatform}
          onOpenMenu={() => setIsDrawerOpen(true)}
          onSelectPlatform={handleSelectPlatform}
          onLogoTap={handleLogoTap}
        />
      )}

      {activePage === 'pw' && (
        <PhysicsWallahView
          onOpenMenu={() => setIsDrawerOpen(true)}
          onBack={() => handleSelectPage('home')}
          onSelectBatch={(batch) => setSelectedBatch(batch)}
        />
      )}

      {activePage !== 'home' && activePage !== 'pw' && (
        <NextToppersView
          platformId={activePage}
          platforms={platforms}
          wishlist={wishlist}
          onToggleWishlist={handleToggleWishlist}
          onOpenMenu={() => setIsDrawerOpen(true)}
          onBack={() => handleSelectPage('home')}
          onSelectBatch={(batch) => setSelectedBatch(batch)}
        />
      )}

      <SidebarDrawer
        isOpen={isDrawerOpen}
        activePage={activePage}
        platforms={platforms}
        onClose={() => setIsDrawerOpen(false)}
        onSelectPage={handleSelectPage}
        onSelectPlatform={handleSelectPlatform}
        onLogoTap={handleLogoTap}
      />

      <CommunityModal
        isOpen={isCommunityModalOpen}
        onClose={() => setIsCommunityModalOpen(false)}
      />

      <BatchStudyModal
        batch={selectedBatch}
        onClose={() => setSelectedBatch(null)}
      />

      <AdminModal
        isOpen={isAdminModalOpen}
        platforms={platforms}
        onClose={() => setIsAdminModalOpen(false)}
        onAddPlatform={handleAddPlatform}
        onUpdatePlatform={handleUpdatePlatform}
        onMovePlatform={handleMovePlatform}
        onDeletePlatform={handleDeletePlatform}
        onResetPlatforms={handleResetPlatforms}
      />
    </div>
  );
}
