import { useEffect, useState } from 'react';
import type { AppData } from './types';
import { loadData, saveData } from './storage';
import Shelf from './components/Shelf';
import NotebookView from './components/NotebookView';
import PageEditor from './components/PageEditor';
import HighlightsView from './components/HighlightsView';
import './App.css';

type Screen =
  | { kind: 'shelf' }
  | { kind: 'notebook'; notebookId: string }
  | { kind: 'page'; notebookId: string; pageId: string }
  | { kind: 'highlights' };

export default function App() {
  const [data, setData] = useState<AppData>(() => loadData());
  const [screen, setScreen] = useState<Screen>({ kind: 'shelf' });

  useEffect(() => {
    saveData(data);
  }, [data]);

  if (screen.kind === 'shelf') {
    return (
      <Shelf
        data={data}
        onOpen={(id) => setScreen({ kind: 'notebook', notebookId: id })}
        onChange={setData}
        onShowHighlights={() => setScreen({ kind: 'highlights' })}
      />
    );
  }

  if (screen.kind === 'highlights') {
    return (
      <HighlightsView
        data={data}
        onBack={() => setScreen({ kind: 'shelf' })}
        onOpenPage={(notebookId, pageId) => setScreen({ kind: 'page', notebookId, pageId })}
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
      onChange={setData}
    />
  );
}
