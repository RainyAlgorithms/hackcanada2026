'use client';

import dynamic from 'next/dynamic';

const PropertyMap = dynamic(() => import('./components/PropertyMap'), {
  ssr: false,
  loading: () => (
    <div style={{
      width: '100vw', height: '100vh',
      background: 'linear-gradient(135deg, #0a0a0f, #0d1030)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{ color: '#475569', fontFamily: 'sans-serif', fontSize: 14 }}>
        Initializing map…
      </div>
    </div>
  ),
});

export default function Page() {
  return <PropertyMap />;
}
