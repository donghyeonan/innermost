'use client';

import { useState, useCallback } from 'react';
import Spline from '@splinetool/react-spline';
import type { Application } from '@splinetool/runtime';

const SPLINE_SCENE_URL = 'https://prod.spline.design/wZUISB1AGUjLtefI/scene.splinecode';

export default function SplineBackground() {
    const [isLoaded, setIsLoaded] = useState(false);

    const handleLoad = useCallback((splineApp: Application) => {
        // Disable zoom and pan for passive background behavior
        splineApp.setZoom(1);

        // Trigger fade-in animation
        setIsLoaded(true);
    }, []);

    return (
        <div
            className={`
        absolute inset-0 z-0
        hidden md:block
        pointer-events-none
        transition-opacity duration-700 ease-out
        ${isLoaded ? 'opacity-100' : 'opacity-0'}
      `}
        >
            <Spline
                scene={SPLINE_SCENE_URL}
                onLoad={handleLoad}
                style={{
                    width: '100%',
                    height: '100%',
                }}
            />
        </div>
    );
}
