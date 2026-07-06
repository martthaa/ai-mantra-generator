import React from 'react';
import { createRoot } from 'react-dom/client';

function ShaderBackground() {
  return <div className="shader-background__image" aria-hidden="true" />;
}

export function mountShaderBackground(target = document.body) {
  if (document.getElementById('shader-background-root')) {
    return;
  }

  const rootElement = document.createElement('div');
  rootElement.id = 'shader-background-root';
  rootElement.className = 'shader-background';
  target.prepend(rootElement);

  createRoot(rootElement).render(<ShaderBackground />);
}
