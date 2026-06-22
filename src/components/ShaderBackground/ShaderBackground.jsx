import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Water } from '@paper-design/shaders-react';

function useViewportSize() {
  const [size, setSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    function updateSize() {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }

    window.addEventListener('resize', updateSize);

    return () => {
      window.removeEventListener('resize', updateSize);
    };
  }, []);

  return size;
}

function ShaderBackground() {
  const size = useViewportSize();

  return (
    <Water
      width={size.width}
      height={size.height}
      image="https://paper.design/flowers.webp"
      colorBack="#8f8f8f"
      colorHighlight="#ffffff"
      highlights={0.07}
      layering={0.5}
      edges={0.8}
      waves={0.3}
      caustic={0.1}
      size={1}
      speed={1}
      scale={0.8}
      fit="contain"
    />
  );
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
