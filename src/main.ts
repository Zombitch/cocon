import './style.css';
import { startRouter } from './router';

const root = document.getElementById('app');
if (!root) throw new Error('#app not found');

startRouter(root);
