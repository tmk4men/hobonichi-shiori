import { useEffect, useState } from 'react';
import type { AppData } from './types';
import { loadData, saveData } from './storage';
import { loadLock } from './auth';
import Shelf from './components/Shelf';
import NotebookView from './components/NotebookView';
import PageEditor from './components/PageEditor';
import HighlightsView from './components/HighlightsView';
import NotebookManager from './components/NotebookManager';
import Menu from './components/Menu';
import PasswordSheet from './components/PasswordSheet';
import IconChooser from './components/IconChooser';
import LockScreen from './components/LockScreen';
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
  const [showIconChooser, setShowIconChooser] = useState(false);
  const [hasPassword, setHasPassword] = useState<boolean>(() => !!loadLock());
  const [unlocked, setUnlocked] = useState<boolean>(() => !loadLock());

  useEffect(() => {
    saveData(data);
  }, [data]);

  if (!unlocked) {
    return <LockScreen onUnlock={() => setUnlocked(true)} />;
  }

  const goPage = (notebookId: string, pageId: string) =>
    setScreen({ kind: 'page', notebookId, pageId });

  const screenEl = () => {
    if (screen.kind === 'shelf') {
      return (
        <Shelf
          data={data}
          onOpen={(id) => setScreen({ kind: 'notebook', notebookId: id })}
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

  return (
    <>
      {screenEl()}
      {showMenu && (
        <Menu
          hasPassword={hasPassword}
          onClose={() => setShowMenu(false)}
          onShowHighlights={() => setScreen({ kind: 'highlights' })}
          onShowNotebookManager={() => setScreen({ kind: 'manager' })}
          onShowPassword={() => setShowPassword(true)}
          onShowIconChooser={() => setShowIconChooser(true)}
        />
      )}
      {showPassword && (
        <PasswordSheet
          onClose={() => setShowPassword(false)}
          onChanged={() => setHasPassword(!!loadLock())}
        />
      )}
      {showIconChooser && (
        <IconChooser onClose={() => setShowIconChooser(false)} />
      )}
    </>
  );
}
