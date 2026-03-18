import type { FC } from 'react';

export const InfoIcon: FC = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        className="h-3.5 w-3.5"
        aria-hidden="true"
    >
        <circle
            cx="10"
            cy="10"
            r="9"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
        />
        <text
            x="10"
            y="14.5"
            textAnchor="middle"
            fontSize="11"
            fontWeight="bold"
            fill="currentColor"
        >
            i
        </text>
    </svg>
);
