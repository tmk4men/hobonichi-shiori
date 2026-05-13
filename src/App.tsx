import { useEffect, useMemo, useState } from 'react';
import type { AppData, Page } from './types';
import { ensureTodayPage, loadData, saveData, todayStr } from './storage';
import { loadLock } from './auth';
import { applyWriteFont } from './writeFont';
import { applyTextScale, applyTheme } from './theme';
import Shelf from './components/Shelf';
import NotebookView from './components/NotebookView';
import PageEditor from './components/PageEditor';
import HighlightsView from './components/HighlightsView';
import NotebookManager from './components/NotebookManager';
import Menu from './components/Menu';
import CreditsSheet from './components/CreditsSheet';
import PasswordSheet from './components/PasswordSheet';
import LockScreen from './components/LockScreen';
import Welcome from './components/Welcome';
import type { Notebook } from './types';
import './App.css';

type Screen =
  | { kind: 'shelf' }
  | { kind: 'notebook'; notebookId: string }
  | { kind: 'page'; notebookId: string; pageId: string }
  | { kind: 'highlights' }
  | { kind: 'manager' };

export default function App() {
  const [data, setData] = useState<AppData>(() => loadData());
  const [screen, setScreen] = useState<Screen>({ kind: 'shelf' });
  const [showMenu, setShowMenu] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showCredits, setShowCredits] = useState(false);
  const [hasPassword, setHasPassword] = useState<boolean>(() => !!loadLock());
  const [unlocked, setUnlocked] = useState<boolean>(() => !loadLock());
  const [reminderDismissed, setReminderDismissed] = useState(false);

  // 「○年前のきょう」 同じMM-DDの過去ページを最新→古い順に
  const onThisDay = useMemo<Page[]>(() => {
    const today = todayStr();
    const mmdd = today.slice(5);
    return data.pages
      .filter((p) => p.date.slice(5) === mmdd && p.date < today)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [data.pages]);

  // 日付ごとに1回だけ表示
  useEffect(() => {
    if (onThisDay.length === 0) {
      setReminderDismissed(true);
      return;
    }
    try {
      const seen = localStorage.getItem('hobonichi.reminderSeen');
      if (seen === todayStr()) setReminderDismissed(true);
    } catch {
      /* noop */
    }
  }, [onThisDay.length]);

  const dismissReminder = () => {
    setReminderDismissed(true);
    try {
      localStorage.setItem('hobonichi.reminderSeen', todayStr());
    } catch {
      /* noop */
    }
  };

  useEffect(() => {
    saveData(data);
  }, [data]);

  useEffect(() => {
    applyWriteFont();
    applyTheme();
    applyTextScale();
  }, []);

  if (!unlocked) {
    return <LockScreen onUnlock={() => setUnlocked(true)} />;
  }

  if (data.notebooks.length === 0) {
    return (
      <Welcome
        onComplete={(nb: Notebook) => {
          setData({ ...data, notebooks: [nb] });
          setScreen({ kind: 'notebook', notebookId: nb.id });
        }}
      />
    );
  }

  const goPage = (notebookId: string, pageId: string) =>
    setScreen({ kind: 'page', notebookId, pageId });

  const screenEl = () => {
    if (screen.kind === 'shelf') {
      return (
        <Shelf
          data={data}
          onOpen={(id) => {
            // ノートを開いたら、今日のページへ直行
            const { data: nextData, pageId } = ensureTodayPage(data, id);
            if (!pageId) {
              // 45ページ上限。もくじへ
              setScreen({ kind: 'notebook', notebookId: id });
              return;
            }
            if (nextData !== data) setData(nextData);
            setScreen({ kind: 'page', notebookId: id, pageId });
          }}
          onChange={setData}
          onShowHighlights={() => setScreen({ kind: 'highlights' })}
          onOpenPage={goPage}
          onOpenMenu={() => setShowMenu(true)}
        />
      );
    }
    if (screen.kind === 'highlights') {
      return (
        <HighlightsView
          data={data}
          onBack={() => setScreen({ kind: 'shelf' })}
          onOpenPage={goPage}
        />
      );
    }
    if (screen.kind === 'manager') {
      return (
        <NotebookManager
          data={data}
          onBack={() => setScreen({ kind: 'shelf' })}
          onChange={setData}
        />
      );
    }
    if (screen.kind === 'notebook') {
      return (
        <NotebookView
          data={data}
          notebookId={screen.notebookId}
          onBack={() => setScreen({ kind: 'shelf' })}
          onOpenPage={(pageId) =>
            setScreen({ kind: 'page', notebookId: screen.notebookId, pageId })
          }
          onChange={setData}
        />
      );
    }
    return (
      <PageEditor
        data={data}
        pageId={screen.pageId}
        onBack={() => setScreen({ kind: 'notebook', notebookId: screen.notebookId })}
        onOpenPage={(pageId) =>
          setScreen({ kind: 'page', notebookId: screen.notebookId, pageId })
        }
        onChange={setData}
      />
    );
  };

  const showReminder =
    !reminderDismissed && onThisDay.length > 0 && screen.kind === 'shelf';
  const recentReminder = onThisDay[0];
  const yearsAgo = recentReminder
    ? new Date().getFullYear() - Number(recentReminder.date.slice(0, 4))
    : 0;

  return (
    <>
      {screenEl()}
      {showReminder && recentReminder && (
        <button
          className="reminder-toast"
          onClick={() => {
            dismissReminder();
            goPage(recentReminder.notebookId, recentReminder.id);
          }}
        >
          <span className="reminder-eyebrow">
            {yearsAgo > 0 ? `${yearsAgo}年前の きょう` : 'むかしの きょう'}
          </span>
          <span className="reminder-body">
            {recentReminder.text.slice(0, 28) || '（白紙のページ）'}
          </span>
          <span
            className="reminder-close"
            onClick={(e) => {
              e.stopPropagation();
              dismissReminder();
            }}
            aria-label="閉じる"
          >
            ×
          </span>
        </button>
      )}
      {showMenu && (
        <Menu
          hasPassword={hasPassword}
          onClose={() => setShowMenu(false)}
          onShowHighlights={() => setScreen({ kind: 'highlights' })}
          onShowNotebookManager={() => setScreen({ kind: 'manager' })}
          onShowPassword={() => setShowPassword(true)}
          onShowCredits={() => setShowCredits(true)}
        />
      )}
      {showPassword && (
        <PasswordSheet
          onClose={() => setShowPassword(false)}
          onChanged={() => setHasPassword(!!loadLock())}
        />
      )}
      {showCredits && <CreditsSheet onClose={() => setShowCredits(false)} />}
    </>
  );
}
