import '../config/grid.js';
import '../components/Playground/Playground.js';
import '../components/GridOverlay/GridOverlay.js';
import { mountShaderBackground } from '../components/ShaderBackground/ShaderBackground.jsx';

document.body.classList.add('page-playground');

mountShaderBackground();
window.Playground.mountPlayground(document.getElementById('app'));
window.GridOverlay.mountGridOverlay();
