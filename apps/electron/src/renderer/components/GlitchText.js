import { jsx as _jsx } from "react/jsx-runtime";
import './GlitchText.css';
const GlitchText = ({ children, speed = 0.5, enableShadows = true, enableOnHover = false, className = '' }) => {
    const inlineStyles = {
        '--after-duration': `${speed * 3}s`,
        '--before-duration': `${speed * 2}s`,
        '--after-shadow': enableShadows ? '-2px 0 red' : 'none',
        '--before-shadow': enableShadows ? '2px 0 cyan' : 'none'
    };
    const hoverClass = enableOnHover ? 'enable-on-hover' : '';
    return (_jsx("div", { className: `glitch ${hoverClass} ${className}`, style: inlineStyles, "data-text": children, children: children }));
};
export default GlitchText;
//# sourceMappingURL=GlitchText.js.map