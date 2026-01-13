'use client';

import Spline from '@splinetool/react-spline';

export default function SplineBackground() {
    return (
        <div
            className="
                absolute inset-0 z-0
                hidden md:block
                pointer-events-none
            "
        >
            <main>
                <Spline
                    scene="https://prod.spline.design/K8GHba1hsdCuj4Ip/scene.splinecode"
                />
            </main>
        </div>
    );
}
