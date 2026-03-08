import React, { useRef, useState, useEffect } from 'react';

interface ChartContainerProps {
    height: number;
    children: (width: number, height: number) => React.ReactNode;
}

/**
 * A custom chart container that replaces Recharts' ResponsiveContainer.
 * It measures the parent DOM element via ResizeObserver BEFORE rendering
 * the chart, which eliminates the "width(-1) height(-1)" warning that
 * ResponsiveContainer produces on every initial render.
 */
const ChartContainer: React.FC<ChartContainerProps> = ({ height, children }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        const observer = new ResizeObserver((entries) => {
            const entry = entries[0];
            if (entry) {
                const { width, height: h } = entry.contentRect;
                if (width > 0 && h > 0) {
                    setDimensions({ width, height: h });
                }
            }
        });

        observer.observe(el);

        return () => observer.disconnect();
    }, []);

    return (
        <div ref={containerRef} style={{ width: '100%', height }}>
            {dimensions ? children(dimensions.width, dimensions.height) : null}
        </div>
    );
};

export default ChartContainer;
