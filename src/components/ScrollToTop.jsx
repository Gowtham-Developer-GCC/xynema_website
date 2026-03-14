import { useEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

const ScrollToTop = () => {
    const { pathname, hash } = useLocation();
    const navType = useNavigationType();

    useEffect(() => {
        // Only scroll to top on forward/replacement navigation (PUSH/REPLACE)
        // POP navigation (Back/Forward buttons) should use the browser's native scroll restoration
        if (navType !== 'POP') {
            if (!hash) {
                window.scrollTo(0, 0);
            } else {
                const id = hash.replace('#', '');
                const element = document.getElementById(id);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth' });
                }
            }
        }
    }, [pathname, hash, navType]);

    return null;
};

export default ScrollToTop;
