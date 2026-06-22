import '../config/grid.js';
import '../components/Header/Header.js';
import '../components/HeroContent/HeroContent.js';
import '../components/GridOverlay/GridOverlay.js';
import { mountShaderBackground } from '../components/ShaderBackground/ShaderBackground.jsx';

mountShaderBackground();
window.Header.mountHeader();
window.HeroContent.mountHeroContent(document.getElementById('app'));
window.GridOverlay.mountGridOverlay();
