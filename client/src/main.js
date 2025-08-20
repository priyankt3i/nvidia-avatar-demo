import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { App } from './ui/App';
const root = createRoot(document.getElementById('root'));
root.render(_jsx(React.StrictMode, { children: _jsx(App, {}) }));
