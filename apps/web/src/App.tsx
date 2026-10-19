import { lazy, Suspense, useEffect, useState } from 'react';
import {
  emptyWorkspace,
  sampleWorkspace,
  type Workspace as WorkspaceData,
} from '@blueprint/shared';
import { loadWorkspace } from './api';
import { Workspace } from './components/Workspace';
const Studio = lazy(() => import('./components/Studio'));
export default function App() {
  const [data, setData] = useState<WorkspaceData>(emptyWorkspace);
  const [status, setStatus] = useState<'loading' | 'ready' | 'offline'>('loading');
  const [sample, setSample] = useState(false);
  const [studio, setStudio] = useState(location.hash === '#manage');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setStatus('loading');
    loadWorkspace(controller.signal)
      .then((d) => {
        setData(d);
        setStatus('ready');
      })
      .catch((e) => {
        if (e.name !== 'AbortError') setStatus('offline');
      });
    return () => controller.abort();
  }, [attempt]);
  useEffect(() => {
    const change = () => setStudio(location.hash === '#manage');
    window.addEventListener('hashchange', change);
    return () => window.removeEventListener('hashchange', change);
  }, []);
  if (studio)
    return (
      <Suspense fallback={<div className="loading-screen">Opening the studio…</div>}>
        <Studio
          onClose={() => {
            location.hash = '';
            setStudio(false);
            setAttempt((n) => n + 1);
          }}
        />
      </Suspense>
    );
  return (
    <Workspace
      key={sample ? 'sample' : 'live'}
      data={sample ? { ...sampleWorkspace, profile: data.profile } : data}
      mode={sample ? 'sample' : 'live'}
      status={status}
      onSample={() => setSample((v) => !v)}
      onRetry={() => setAttempt((n) => n + 1)}
      onManage={() => {
        location.hash = 'manage';
        setStudio(true);
      }}
    />
  );
}
